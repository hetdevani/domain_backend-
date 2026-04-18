import { Request, Response } from 'express';
import passport from 'passport';
import { messages } from '../message';
import { SuccessResponseHandler } from '../../common/response/successResponse';
import { ErrorResponseHandler } from '../../common/response/errorResponse';
import UserService from '../../User/services/UserService';
import NotificationService from '../../Notification/services/NotificationService';
import { JWTUtil } from '../utils/JWTUtil';
import { IUser } from '../../User/interfaces/IUser';
import { OTPUtil } from '../utils/OTPUtil';
import { PROJECT_CONFIG } from '../../common/config/ProjectConfig';
import { MOBILE_USER_TYPES, ADMIN_USER_TYPES } from '../../common/constants/common';
import * as speakeasy from 'speakeasy';
import ActivityLogService from '../../ActivityLog/services/ActivityLogService';
import { ACTION_TYPES, LOG_STATUS } from '../../ActivityLog/constants/activityLogConstants';
import AuthSessionService from '../services/AuthSessionService';
import logger from '../../common/services/WinstonLogger';

export class WebAuthController {
    public async login(req: Request, res: Response): Promise<Response> {
        try {
            const result = await new Promise<any>((resolve, reject) => {
                passport.authenticate('web-local', { session: false }, (err: Error, authResult: any, info: { message: string; }) => {
                    if (err) {
                        reject(err);
                    }
                    resolve({ authResult, info });
                })(req, res);
            });

            const { authResult, info } = result;

            if (!authResult) {
                throw info;
            }

            const { user } = authResult;
            const sanitizedUser = UserService.sanitizeUser(user);

            // Create persistent session
            const session = await AuthSessionService.createSession(
                user._id.toString(),
                req.ip,
                req.headers['user-agent']
            );
            const refreshToken = session.refreshToken;

            // Update access token to include sessionId for instant revocation
            const tokenWithSession = JWTUtil.generateToken(user._id.toString(), user.type === 1, session._id.toString());

            // Set refresh token in HttpOnly cookie
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
            });

            // Log activity
            req.user = user;
            await ActivityLogService.logFromRequest(req, 'Auth', ACTION_TYPES.LOGIN, {
                description: 'User logged in successfully via Web',
                status: LOG_STATUS.SUCCESS
            });

            return SuccessResponseHandler.sendSuccessResponse(res, messages.LOGIN_SUCCESSFULLY, { token: tokenWithSession, refreshToken, user: sanitizedUser });
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async authenticateRegistered(req: Request, res: Response): Promise<Response> {
        const { username } = req.body;
        const preferredLang = req.headers.language as string;
        try {
            const user = await UserService.getUserByEmailOrMobile(username, ADMIN_USER_TYPES);
            if (!user) {
                throw messages.NOT_FOUND;
            }

            const secret = speakeasy.generateSecret({
                name: 'Base Authenticator',
                length: 20,
            });
            const otpauthURL = speakeasy.otpauthURL({
                secret: secret.base32,     // ⚠️ Use base32 here
                label: user.email, // Replace with user email
                issuer: 'Base Authenticator',
                algorithm: 'sha512',
                encoding: 'base32',        // ⚠️ Must match with secret
                digits: 6,
                period: 30,
            });

            const sanitizedUser = UserService.sanitizeUser(user);
            return SuccessResponseHandler.sendSuccessResponse(res, messages.USER_AUTHENTICATED_SUCCESSFULLY, { user: sanitizedUser, secreateKey: { ...secret, uri: otpauthURL } });
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async authenticateOtpVerification(req: Request, res: Response): Promise<Response> {
        const { username, otp, secretKey } = req.body;
        const preferredLang = req.headers.language as string;
        try {
            const user = await UserService.getUserByEmailOrMobile(username, ADMIN_USER_TYPES);
            if (!user) {
                throw messages.NOT_FOUND;
            }

            // If two-factor is enabled, use the stored secret key. 
            // If not, use the secret key provided in the request (setup phase).
            const effectiveSecretKey = user.isTwoFactorEnabled ? user.secretKey : secretKey;

            if (!effectiveSecretKey) {
                return ErrorResponseHandler.sendErrorResponse(res, {
                    code: 'E_BAD_REQUEST',
                    message: 'Secret key is missing for two-factor authentication setup.',
                    status: 400,
                });
            }

            const verified = speakeasy.totp.verify({
                secret: effectiveSecretKey,       // Use effective secret key
                encoding: 'base32',      // ⚠️ Must be base32
                token: otp,              // OTP user typed
                algorithm: 'sha512',
                // digits: 6,               // Optional: number of digits in OTP
                // step: 30,                // Optional: time step in seconds
                window: 2,               // Optional: allow +/- 1 step for clock skew
            });

            if (!verified) {
                throw messages.INVALID_OTP;
            }

            if (!user.isTwoFactorEnabled) {
                logger.info('Enabling two factor authentication for user:', { data: user._id });
                await UserService.updateOne({ _id: user._id }, { secretKey: secretKey, isTwoFactorEnabled: true });
            }

            const result = await new Promise<any>((resolve, reject) => {
                passport.authenticate('web-2-step', { session: false }, (err: Error, authResult: any, info: { message: string; }) => {
                    if (err) {
                        reject(err);
                    }
                    resolve({ authResult, info });
                })(req, res);
            });

            const { authResult, info } = result;

            if (!authResult) {
                throw info;
            }

            const { user: authenticatedUser } = authResult; // Extract user from authResult

            // Create persistent session
            const session = await AuthSessionService.createSession(
                authenticatedUser._id.toString(),
                req.ip,
                req.headers['user-agent']
            );
            const refreshToken = session.refreshToken;

            // Update access token to include sessionId
            const tokenWithSession = JWTUtil.generateToken(authenticatedUser._id.toString(), authenticatedUser.type === 1, session._id.toString());

            // Set refresh token in HttpOnly cookie
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
            });

            const sanitizedUser = UserService.sanitizeUser(authenticatedUser);

            // Log activity
            req.user = authenticatedUser;
            await ActivityLogService.logFromRequest(req, 'Auth', ACTION_TYPES.LOGIN, {
                description: 'User logged in successfully via 2FA',
                status: LOG_STATUS.SUCCESS
            });

            return SuccessResponseHandler.sendSuccessResponse(res, messages.USER_AUTHENTICATED_SUCCESSFULLY, { token: tokenWithSession, refreshToken, user: sanitizedUser });
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async authenticateReset(req: Request, res: Response): Promise<Response> {
        try {
            const { username } = req.body;
            const user = await UserService.getUserByEmailOrMobile(username, ADMIN_USER_TYPES);
            if (!user) {
                throw messages.NOT_FOUND;
            }

            if (user.isTwoFactorEnabled) {
                await UserService.updateOne({ _id: user._id }, { isTwoFactorEnabled: false, secretKey: "" });
                const updatedUser = await UserService.findById(user._id);
                const sanitizedUser = updatedUser ? UserService.sanitizeUser(updatedUser) : null;
                return SuccessResponseHandler.sendSuccessResponse(res, messages.USER_AUTHENTICATED_SUCCESSFULLY, { updatedUser: sanitizedUser });
            } else {
                return ErrorResponseHandler.sendErrorResponse(res, messages.TWO_FACTOR_NOT_ENABLED);
            }

        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    // Implement forgot password and reset password functionalities
    public async forgotPassword(req: Request, res: Response): Promise<Response> {
        const { username } = req.body;
        const preferredLang = req.headers.language as string;
        try {
            await UserService.forgotPassword(username, preferredLang, true);

            return SuccessResponseHandler.sendSuccessResponse(res, messages.OTP_SEND_SUCCESSFULLY, {});
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async verifyOtp(req: Request, res: Response): Promise<Response> {
        const params = req.body;
        const preferredLang = req.headers.language as string;
        try {
            await UserService.verifyOtp(params, preferredLang, true);

            return SuccessResponseHandler.sendSuccessResponse(res, messages.OTP_VERIFY_SUCCESSFULLY, {});
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async resetPassword(req: Request, res: Response): Promise<Response> {
        const params = req.body;
        const preferredLang = req.headers.language as string;
        try {
            await UserService.resetPassword(params, preferredLang, true);
            return SuccessResponseHandler.sendSuccessResponse(res, messages.RESET_PASSWORD_SUCCESSFULLY, {});
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async sendOTP(req: Request, res: Response): Promise<Response> {
        try {
            const { username, userType } = req.body;
            let user = await UserService.getUserByEmailOrMobile(username, ADMIN_USER_TYPES);

            if (!user) {
                // If the user is not found and createNewCustomer is true, create a new customer account
                if (!PROJECT_CONFIG.CREATE_NEW_CUSTOMER) {
                    throw messages.NOT_FOUND;
                }
                let data: any = {};
                if (username.includes('@')) {
                    data.email = username;
                } else {
                    data.mobile = username;
                }
                user = await UserService.create(data);
            }
            logger.info('sendOTP user', { userId: user._id, userType: user.type });
            // Generate a new OTP
            const otp = OTPUtil.generateOTP();

            // Send the OTP to the user's mobile or email
            if (user.mobile === username) {
                await OTPUtil.sendOTPViaSMS(user.name, user.mobile, user.countryCode, otp);
            } else if (user.email === username) {
                await OTPUtil.sendOTPViaEmail(user.name, user.email, otp, "Admin Login OTP");
            } else {
                throw messages.INVALID_USER;
            }

            // Update user's OTP and otpSentTime fields in the database
            user.otp = otp;
            user.otpSentTime = new Date();
            let updatedUser = await user.save();

            // logger.info('updatedUser', { data: updatedUser });
            // res.json({ message: 'OTP sent successfully' });
            // todo response message
            return SuccessResponseHandler.sendSuccessResponse(res, messages.OTP_SEND_SUCCESSFULLY, {});
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async loginWithOTP(req: Request, res: Response): Promise<Response> {
        try {
            const result = await new Promise<any>((resolve, reject) => {
                passport.authenticate('web-local-otp', { session: false }, (err: Error, authResult: any, info: { message: string; }) => {
                    if (err) {
                        reject(err);
                    }
                    resolve({ authResult, info });
                })(req, res);
            });

            const { authResult, info } = result;

            if (!authResult) {
                throw info;
            }

            const { user } = authResult;
            const sanitizedUser = UserService.sanitizeUser(user);

            // Create persistent session
            const session = await AuthSessionService.createSession(
                user._id.toString(),
                req.ip,
                req.headers['user-agent']
            );
            const refreshToken = session.refreshToken;

            // Update access token to include sessionId
            const tokenWithSession = JWTUtil.generateToken(user._id.toString(), user.type === 1, session._id.toString());

            // Set refresh token in HttpOnly cookie
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
            });

            // Log activity
            req.user = user;
            await ActivityLogService.logFromRequest(req, 'Auth', ACTION_TYPES.LOGIN, {
                description: 'User logged in successfully via OTP',
                status: LOG_STATUS.SUCCESS
            });

            return SuccessResponseHandler.sendSuccessResponse(res, messages.LOGIN_SUCCESSFULLY, { token: tokenWithSession, refreshToken, user: sanitizedUser });
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async logout(req: Request, res: Response): Promise<Response> {
        try {
            logger.info('logout');
            let user = req.user as IUser;
            let token = req.headers.authorization?.replace('Bearer ', '') as string;

            // let deviceType = Number(req.headers.devicetype as string);
            // let deviceId = req.headers.deviceid as string;

            // Deactivate session if sessionId is in token
            const decodedToken = JWTUtil.verifyToken(token) as any;
            if (decodedToken && decodedToken.sessionId) {
                await AuthSessionService.revokeSessionById(decodedToken.sessionId);
            }

            // Blacklist the token
            JWTUtil.addToBlacklist(token);

            // Clear refresh token cookie
            res.clearCookie('refreshToken');

            let data: any = {
                name: user.name,
                userId: user._id
            };

            await NotificationService.sendMessage('User', 'logout', data);

            // Log activity
            await ActivityLogService.logFromRequest(req, 'Auth', ACTION_TYPES.LOGOUT, {
                description: 'User logged out successfully',
                status: LOG_STATUS.SUCCESS
            });

            return SuccessResponseHandler.sendSuccessResponse(res, messages.LOGOUT_SUCCESSFULLY, {});
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async refreshToken(req: Request, res: Response): Promise<Response> {
        try {
            const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
            if (!refreshToken) {
                throw { status: 400, message: 'Refresh token is required' };
            }

            const session = await AuthSessionService.validateRefreshToken(refreshToken);
            if (!session) {
                // Clear invalid cookie
                res.clearCookie('refreshToken');
                throw { status: 401, message: 'Invalid or expired refresh token' };
            }

            const user = await UserService.findById(session.userId.toString());
            if (!user || !user.isActive || user.isDeleted) {
                res.clearCookie('refreshToken');
                throw { status: 401, message: 'User not found or inactive' };
            }

            const isAdmin = ADMIN_USER_TYPES.includes(user.type);
            const newToken = JWTUtil.generateToken(user._id.toString(), isAdmin, session._id.toString());

            return SuccessResponseHandler.sendSuccessResponse(res, messages.LOGIN_SUCCESSFULLY, {
                token: newToken
            });
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async listSessions(req: Request, res: Response): Promise<Response> {
        try {
            const loggedInUser = req.user as IUser;
            const { userId } = req.query;
            const targetUserId = userId ? (userId as string) : loggedInUser._id.toString();

            // Permission check: Admin can see any user, Parent can see their child, User can see themselves
            const isSelf = targetUserId === loggedInUser._id.toString();
            const isAdmin = ADMIN_USER_TYPES.includes(loggedInUser.type);

            let isParent = false;
            if (!isSelf && !isAdmin) {
                const targetUser = await UserService.findById(targetUserId);
                if (targetUser && targetUser.parentId && targetUser.parentId.toString() === loggedInUser._id.toString()) {
                    isParent = true;
                }
            }

            if (!isSelf && !isAdmin && !isParent) {
                throw { status: 403, message: 'Permission denied' };
            }

            const sessions = await AuthSessionService.getUserSessions(targetUserId);
            return SuccessResponseHandler.sendSuccessResponse(res, messages.OK, { sessions });
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async revokeSession(req: Request, res: Response): Promise<Response> {
        try {
            const loggedInUser = req.user as IUser;
            const { refreshToken, sessionId } = req.body;

            if (!refreshToken && !sessionId) {
                throw { status: 400, message: 'Refresh token or Session ID is required' };
            }

            let session;
            if (sessionId) {
                session = await AuthSessionService.getSessionById(sessionId);
            } else {
                session = await AuthSessionService.validateRefreshToken(refreshToken);
            }

            if (!session) {
                throw { status: 404, message: 'Session not found' };
            }

            // Permission check: User can revoke their own, Admin can revoke anyone's, Parent can revoke child's
            const isSelf = session.userId.toString() === loggedInUser._id.toString();
            const isAdmin = ADMIN_USER_TYPES.includes(loggedInUser.type);

            let isParent = false;
            if (!isSelf && !isAdmin) {
                const targetUser = await UserService.findById(session.userId.toString());
                if (targetUser && targetUser.parentId && targetUser.parentId.toString() === loggedInUser._id.toString()) {
                    isParent = true;
                }
            }

            if (!isSelf && !isAdmin && !isParent) {
                throw { status: 403, message: 'Permission denied' };
            }

            if (sessionId) {
                await AuthSessionService.revokeSessionById(sessionId);
            } else {
                await AuthSessionService.revokeSession(refreshToken);
            }

            // If the revoked session is the current one, clear the cookie
            // We use the refreshToken check if available, or if the sessionId matches the token's sessionId
            const currentToken = req.headers.authorization?.replace('Bearer ', '');
            let isCurrentSession = false;

            if (refreshToken && req.cookies.refreshToken === refreshToken) {
                isCurrentSession = true;
            } else if (currentToken) {
                const decodedToken = JWTUtil.verifyToken(currentToken) as any;
                if (decodedToken && decodedToken.sessionId === session._id.toString()) {
                    isCurrentSession = true;
                }
            }

            if (isCurrentSession) {
                res.clearCookie('refreshToken');
            }

            // Log activity
            await ActivityLogService.logFromRequest(req, 'Auth', ACTION_TYPES.UPDATE, {
                description: `Session revoked for user ${session.userId}`,
                status: LOG_STATUS.SUCCESS
            });

            return SuccessResponseHandler.sendSuccessResponse(res, messages.OK, { message: 'Session revoked successfully' });
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async revokeAllSessions(req: Request, res: Response): Promise<Response> {
        try {
            const loggedInUser = req.user as IUser;
            const { userId } = req.body;

            const targetUserId = userId || loggedInUser._id.toString();

            // Permission check: User can revoke their own, Admin can revoke any, Parent can revoke child's
            const isSelf = targetUserId === loggedInUser._id.toString();
            const isAdmin = ADMIN_USER_TYPES.includes(loggedInUser.type);

            let isParent = false;
            if (!isSelf && !isAdmin) {
                const targetUser = await UserService.findById(targetUserId);
                if (targetUser && targetUser.parentId && targetUser.parentId.toString() === loggedInUser._id.toString()) {
                    isParent = true;
                }
            }

            if (!isSelf && !isAdmin && !isParent) {
                throw { status: 403, message: 'Permission denied' };
            }

            await AuthSessionService.revokeAllUserSessions(targetUserId);

            // If we are revoking our own sessions, clear the cookie
            if (targetUserId === loggedInUser._id.toString()) {
                res.clearCookie('refreshToken');
            }

            // Log activity
            await ActivityLogService.logFromRequest(req, 'Auth', ACTION_TYPES.UPDATE, {
                description: `All sessions revoked for user ${targetUserId}`,
                status: LOG_STATUS.SUCCESS
            });

            return SuccessResponseHandler.sendSuccessResponse(res, messages.OK, { message: 'All sessions revoked successfully' });
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }
}
