import { Request } from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { ADMIN_USER_TYPES, MOBILE_USER_TYPES, USER_TYPES } from '../../common/constants/common';
import { OTPUtil } from './OTPUtil';
import { JWTUtil } from './JWTUtil';
import { IUser } from '../../User/interfaces/IUser';
import UserService from '../../User/services/UserService';
import { messages } from '../message';

export class PassportConfig {
    public static configurePassport(): void {
        passport.use(
            'web-local',
            new LocalStrategy(
                { usernameField: 'username', passwordField: 'password', passReqToCallback: true },
                this.authenticateUser()
            )
        );

        // mobile-login
        passport.use(
            'mobile-user',
            new LocalStrategy(
                { usernameField: 'username', passwordField: 'password', passReqToCallback: true },
                this.authenticateCustomerWithPassword()
            )
        );

        // mobile-otp
        passport.use(
            'local-customer',
            new LocalStrategy(
                { usernameField: 'username', passwordField: 'otp', passReqToCallback: true },
                this.authenticateCustomer()
            )
        );

        passport.use(
            'web-local-otp',
            new LocalStrategy(
                { usernameField: 'username', passwordField: 'otp', passReqToCallback: true },
                this.authenticateUserOTP()
            )
        );

        passport.use(
            'web-2-step',
            new LocalStrategy(
                { usernameField: 'username',passwordField: 'otp', passReqToCallback: true },
                this.TwoStepAuthenticateUserOTP()
            )
        );

        passport.serializeUser((user: any, done) => {
            done(null, user._id);
        });

        passport.deserializeUser((id: string, done) => {

            UserService.findById(id)
                .then((user) => {
                    done(null, user);
                })
                .catch((error) => {
                    done(error);
                });
        });
    }

    private static authenticateUser() {
        return async (req: Request, username: string, password: string, done: (error: any, user?: any, options?: any) => void) => {
            try {
                let user: IUser | null = null;
                // Find the user by either mobile number or email and check isActive and isDeleted
                user = await UserService.getWebUserByEmailOrMobile(username);

                if (!user) {
                    return done(null, false, messages.UNAUTHORIZED_USER);
                    // return done(null, false, messages.NOT_FOUND);
                }

                // Check if the password matches and check isActive and isDeleted
                const isPasswordValid = await user.comparePassword(password); // Use comparePassword method from UserModel
                if (!isPasswordValid) {
                    return done(null, false, messages.INVALID_USER);
                }

                // Generate JWT token using JwtUtils class
                const token = JWTUtil.generateToken(user._id, true);

                // Successful authentication, return JWT token and user object
                return done(null, { token, user });
            } catch (error) {
                return done(error);
            }
        };
    }

    private static authenticateCustomer() {
        return async (req: Request, username: string, otp: string, done: (error: any, user?: any, options?: any) => void) => {
            try {
                let user: IUser | null = null;

                // Find the user by either mobile number or email and check isActive and isDeleted
                user = await UserService.getUserByEmailOrMobile(username, MOBILE_USER_TYPES);

                if (!user) {
                    return done(null, false, messages.NOT_FOUND);
                }

                // Check if the user's OTP matches the provided OTP and if it's not expired (valid for 5 minutes)
                if (!user.otp || !user.otpSentTime) {
                    return done(null, false, messages.INVALID_OTP);
                }
                if (OTPUtil.isOTPValid(user.otp, otp) && !OTPUtil.isOTPExpired(user.otpSentTime)) {

                    // Clear OTP fields
                    user.otp = undefined;
                    user.otpSentTime = undefined;

                    // Save the updated user in the database
                    await user.save();

                    // Generate JWT token using JwtUtils class
                    const token = JWTUtil.generateToken(user._id, false);

                    // Successful authentication, return JWT token and user object
                    return done(null, { token, user });
                } else {
                    return done(null, false, messages.INVALID_OTP);
                }
            } catch (error) {
                return done(error);
            }
        };
    }

    private static authenticateCustomerWithPassword() {
        return async (req: Request, username: string, password: string, done: (error: any, user?: any, options?: any) => void) => {
            try {
                let user: IUser | null = null;
                // Find the user by either mobile number or email and check isActive and isDeleted
                // user = await UserService.getUserByEmailOrMobile(username, MOBILE_USER_TYPES);
                user = await UserService.getActiveDeactiveUserByEmailOrMobile(username, MOBILE_USER_TYPES);

                if (!user) {
                    return done(null, false, messages.NOT_FOUND);
                }
                if (!user.isActive) {
                    return done(null, false, messages.USER_NOT_ACTIVE);
                }

                // Check if the password matches and check isActive and isDeleted
                const isPasswordValid = await user.comparePassword(password); // Use comparePassword method from UserModel
                if (!isPasswordValid) {
                    return done(null, false, messages.INVALID_USER);
                }

                // Generate JWT token using JwtUtils class
                const token = JWTUtil.generateToken(user._id, false);

                // Successful authentication, return JWT token and user object
                return done(null, { token, user });
            } catch (error) {
                return done(error);
            }
        };
    }

    private static authenticateUserOTP() {
        return async (req: Request, username: string, otp: string, done: (error: any, user?: any, options?: any) => void) => {
            try {
                let user: IUser | null = null;

                // Find the user by either mobile number or email and check isActive and isDeleted
                user = await UserService.getUserByEmailOrMobile(username, ADMIN_USER_TYPES);

                if (!user) {
                    return done(null, false, messages.NOT_FOUND);
                }

                // Check if the user's OTP matches the provided OTP and if it's not expired (valid for 5 minutes)
                if (!user.otp || !user.otpSentTime) {
                    return done(null, false, messages.INVALID_OTP);
                }
                if (OTPUtil.isOTPValid(user.otp, otp) && !OTPUtil.isOTPExpired(user.otpSentTime)) {

                    // Clear OTP fields
                    user.otp = undefined;
                    user.otpSentTime = undefined;

                    // Save the updated user in the database
                    await user.save();

                    // Generate JWT token using JwtUtils class
                    const token = JWTUtil.generateToken(user._id, true);

                    // Successful authentication, return JWT token and user object
                    return done(null, { token, user });
                } else {
                    return done(null, false, messages.INVALID_OTP);
                }
            } catch (error) {
                return done(error);
            }
        };
    }

    private static TwoStepAuthenticateUserOTP() {
        return async (req: Request, username: string, otp:string, done: (error: any, user?: any, options?: any) => void) => {
            try {
                let user: IUser | null = null;

                // Find the user by either mobile number or email and check isActive and isDeleted
                user = await UserService.getUserByEmailOrMobile(username, ADMIN_USER_TYPES);
                            
                if (!user) {
                    return done(null, false, messages.NOT_FOUND);
                }

                // Generate JWT token using JwtUtils class
                const token = JWTUtil.generateToken(user._id, true);

                // Successful authentication, return JWT token and user object
                return done(null, { token, user });
            } catch (error) {
                return done(error);
            }
        };
    }
}
