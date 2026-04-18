import { Request, Response } from 'express';
import passport from 'passport';
// import { UserService } from '../services/UserService';
import { OTPUtil } from '../utils/OTPUtil';
import { PROJECT_CONFIG } from '../../common/config/ProjectConfig';
import UserService from '../../User/services/UserService';
import { messages } from '../message';
import { SuccessResponseHandler } from '../../common/response/successResponse';
import { ErrorResponseHandler } from '../../common/response/errorResponse';
import { MOBILE_USER_TYPES, USER_TYPES } from '../../common/constants/common';
import { IUser } from '../../User/interfaces/IUser';
import NotificationService from '../../Notification/services/NotificationService';
import { JWTUtil } from '../utils/JWTUtil';
import { PaginationOptions } from '../../common/constants/interface';
import logger from '../../common/services/WinstonLogger';

export class MobileAuthController {

    public async validateMasterPassword(req: Request, res: Response) {
        try {
            const params = req.body;
            let providedPassword = params.password;

            logger.info('validateMasterPassword', { data: providedPassword, masterPassword: PROJECT_CONFIG.USER_MASTER_PASSWORD });
            let isPasswordValid = false;
            if (providedPassword === PROJECT_CONFIG.USER_MASTER_PASSWORD) {
                isPasswordValid = true;
            } else {
                throw messages.PASSWORD_INVALID;
            }

            return SuccessResponseHandler.sendSuccessResponse(res, messages.LOGIN_SUCCESSFULLY, { isPasswordValid: isPasswordValid });
        } catch (error: any) {
            logger.info('validateMasterPassword error', { data: error });

            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async login(req: Request, res: Response): Promise<Response> {
        try {
            const result = await new Promise<any>((resolve, reject) => {
                passport.authenticate('mobile-user', { session: false }, (err: Error, authResult: any, info: { message: string; }) => {
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

            const { token, user } = authResult;

            let userOptions: PaginationOptions = {
                populateFields: ['parentId'],
                selectFields: [
                    'parentId.name'
                ]
            };
            const loggeInUser = await UserService.findById(user._id, userOptions);

            return SuccessResponseHandler.sendSuccessResponse(res, messages.LOGIN_SUCCESSFULLY, { token, user: loggeInUser });
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async logout(req: Request, res: Response): Promise<Response> {
        try {
            logger.info('logout');
            let user = req.user as IUser;
            let token = req.headers.authorization?.replace('Bearer ', '') as string;

            let deviceType = Number(req.headers.devicetype as string);
            let deviceId = req.headers.deviceid as string;

            // Blacklist the token
            JWTUtil.addToBlacklist(token);

            let data: any = {
                name: user.name,
                userId: user._id
            };

            await NotificationService.sendMessage('User', 'logout', data);
            return SuccessResponseHandler.sendSuccessResponse(res, messages.LOGOUT_SUCCESSFULLY, {});
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }
    public async forgotPassword(req: Request, res: Response): Promise<Response> {
        const { username } = req.body;
        const preferredLang = req.headers.language as string;
        try {
            await UserService.forgotPassword(username, preferredLang);

            return SuccessResponseHandler.sendSuccessResponse(res, messages.OTP_SEND_SUCCESSFULLY, {});
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async verifyOtp(req: Request, res: Response): Promise<Response> {
        const params = req.body;
        const preferredLang = req.headers.language as string;
        try {
            await UserService.verifyOtp(params, preferredLang);

            return SuccessResponseHandler.sendSuccessResponse(res, messages.OTP_VERIFY_SUCCESSFULLY, {});
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async resetPassword(req: Request, res: Response): Promise<Response> {
        const params = req.body;
        const preferredLang = req.headers.language as string;
        try {
            await UserService.resetPassword(params, preferredLang);
            return SuccessResponseHandler.sendSuccessResponse(res, messages.RESET_PASSWORD_SUCCESSFULLY, {});
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async loginWithOTP(req: Request, res: Response): Promise<Response> {
        try {
            const result = await new Promise<any>((resolve, reject) => {
                passport.authenticate('local-customer', { session: false }, (err: Error, authResult: any, info: { message: string; }) => {
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

            const { token, user } = authResult;

            let userOptions: PaginationOptions = {
                populateFields: ['parentId'],
                selectFields: [
                    'parentId.name'
                ]
            };
            const loggeInUser = await UserService.findById(user._id, userOptions);

            return SuccessResponseHandler.sendSuccessResponse(res, messages.LOGIN_SUCCESSFULLY, { token, user: loggeInUser });
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async sendOTP(req: Request, res: Response): Promise<Response> {
        try {
            const { username } = req.body;
            let user = await UserService.getUserByEmailOrMobile(username, MOBILE_USER_TYPES);

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
            logger.info('sendOTP user', { data: user._id, userType: user.type });
            // Generate a new OTP
            const otp = OTPUtil.generateOTP();

            // Send the OTP to the user's mobile or email
            if (user.mobile === username) {
                await OTPUtil.sendOTPViaSMS(user.name, user.mobile, user.countryCode, otp);
            } else if (user.email === username) {
                await OTPUtil.sendOTPViaEmail(user.name, user.email, otp, "Mobile App Login OTP");
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

    public async registerCustomer(req: Request, res: Response) {
        try {
            let params = req.body;

            let userFilter = {
                email: params.email,
                type: USER_TYPES.CUSTOMER
            };
            let user = await UserService.find(userFilter);

            logger.info('registerCustomer user', { data: userFilter, userLength: user.length });
            if (user && user.length > 0) {
                throw messages.EMAIL_ALREADY_EXISTS;
            }

            params.type = USER_TYPES.CUSTOMER;
            const technician = await UserService.create(params);

            return SuccessResponseHandler.sendSuccessResponse(res, messages.OK, technician);
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }
}

// Export the instance of MobileAuthController to be used in routes
export default new MobileAuthController();
