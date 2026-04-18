import { NotificationConfig } from '../common/config/NotificationConfig';
import { USER_TYPES } from '../common/constants/common';

export class UserNotification {

    constructor() {
        NotificationConfig['User'] = {
            'loginOtp': {
                message: `Hello $name, your OTP is $otp.`,
                title: 'Login OTP',
                template: 'LoginOtp',
                templateId: null,
                type: {
                    sms: true,
                    pushNotification: false,
                    email: false,
                    createDb: false,
                    socket: false
                },
                userTypes: [
                    USER_TYPES.MASTER_ADMIN,
                    USER_TYPES.ADMIN,
                ]
            },
            'login': {
                message: 'Hello $name, you are logged in successfully.',
                title: 'Log In',
                template: 'log_in',
                templateId: null,
                type: {
                    sms: true,
                    pushNotification: true,
                    email: false,
                    createDb: true,
                    socket: false
                },
                userTypes: [
                    USER_TYPES.MASTER_ADMIN,
                    USER_TYPES.ADMIN,
                ]
            },
            'logout': {
                message: 'Hello $name, you are logged out successfully.',
                title: 'Log Out',
                template: 'log_out',
                templateId: null,
                type: {
                    sms: false,
                    pushNotification: true,
                    email: false,
                    createDb: false,
                    socket: false
                },
                userTypes: [
                    USER_TYPES.MASTER_ADMIN,
                    USER_TYPES.ADMIN,
                ]
            },
            'register': {
                message: 'Hello $name, you are registered successfully. You can login after admin approval.',
                title: 'Log Out',
                template: 'log_out',
                templateId: null,
                type: {
                    sms: false,
                    pushNotification: true,
                    email: false,
                    createDb: false,
                    socket: false
                },
                userTypes: [
                    USER_TYPES.CUSTOMER
                ]
            },
            'create': {
                message: 'User created successfully',
                title: 'Create User',
                template: 'user_created',
                templateId: null,
                type: {
                    sms: true,
                    pushNotification: true,
                    email: false,
                    createDb: true,
                    socket: false
                },
                userTypes: [
                    USER_TYPES.MASTER_ADMIN,
                    USER_TYPES.ADMIN
                ]
            },
            'update': {
                message: 'User updated successfully',
                title: 'Update User',
                template: 'user_updated',
                templateId: null,
                type: {
                    sms: true,
                    pushNotification: true,
                    email: false,
                    createDb: true,
                    socket: false
                },
                userTypes: [
                    USER_TYPES.MASTER_ADMIN,
                    USER_TYPES.ADMIN
                ]
            },
            'forgotPassword': {
                message: 'OTP code for Reset password is: $otp',
                title: 'Reset Password',
                template: 'ForgotPassword',
                templateId: null,
                type: {
                    sms: false,
                    pushNotification: true,
                    email: true,
                    createDb: false,
                    socket: false
                },
                userTypes: [
                    USER_TYPES.MASTER_ADMIN,
                    USER_TYPES.ADMIN,
                ]
            },
            'resetPassword': {
                message: 'Your password has been successfully reset.',
                title: 'Reset Password',
                template: 'ResetPassword',
                templateId: null,
                type: {
                    sms: false,
                    pushNotification: true,
                    email: true,
                    createDb: false,
                    socket: false
                },
                userTypes: [
                    USER_TYPES.MASTER_ADMIN,
                    USER_TYPES.ADMIN,
                ]
            },
        };
    }
}