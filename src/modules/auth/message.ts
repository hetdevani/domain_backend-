export const messages = {
    LOGIN_SUCCESSFULLY: {
        code: 'OK',
        message: 'Logged in successfully',
        status: 200,
    },
    OTP_SEND_SUCCESSFULLY: {
        code: 'OK',
        message: 'Otp sent successfully.',
        status: 200,
    },
    RESET_PASSWORD_SUCCESSFULLY: {
        code: 'OK',
        message: 'Password reset successfully.',
        status: 200,
    },
    NOT_FOUND: {
        code: 'E_NOT_FOUND',
        message: 'User not found.',
        status: 401,
    },
    INVALID_USER: {
        code: 'E_BAD_REQUEST',
        message: 'User with specified credentials is not found.',
        status: 401,
    },
    INVALID_OTP: {
        code: 'E_BAD_REQUEST',
        message: 'Invalid otp.',
        status: 422,
    },
    INVALID_TOKEN: {
        code: 'E_UNAUTHORIZED',
        message: 'Invalid token.',
        status: 401,
    },
    OTP_VERIFY_SUCCESSFULLY: {
        code: 'OK',
        message: 'Otp verify successfully.',
        status: 200,
    },
    KYC_NOT_APPROVED: {
        code: 'E_BAD_REQUEST',
        message: 'Your KYC is not approved. Please contact admin.',
        status: 401,
    },
    PUNCH_OUT_FIRST: {
        code: 'E_BAD_REQUEST',
        message: 'Please punch out first.',
        status: 422,
    },
    LOGOUT_SUCCESSFULLY: {
        code: 'OK',
        message: 'Logged out successfully',
        status: 200,
    },
    UNAUTHORIZED_USER: {
        code: 'E_NOT_FOUND',
        message: 'Unauthorized user credentials.',
        status: 401,
    },
    USER_NOT_ACTIVE: {
        code: 'E_UNAUTHORIZED',
        message: 'Unauthorized: User is not Active, Please contact Admin.',
        status: 401,
    },
    OK: {
        code: 'OK',
        message: 'OK.',
        status: 200
    },
    PASSWORD_INVALID: {
        code: 'E_BAD_REQUEST',
        message: 'Password invalid',
        status: 401,
    },
    USER_AUTHENTICATED_SUCCESSFULLY: {
        code: 'OK',
        message: 'User authenticated successfully.',
        status: 200,
    },
    TWO_FACTOR_NOT_ENABLED: {
        code: 'E_BAD_REQUEST',
        message: 'Two-factor authentication is not enabled for this user.',
        status: 401,
    },
    EMAIL_ALREADY_EXISTS: {
        code: 'E_BAD_REQUEST',
        message: 'Email already exists.',
        status: 422,
    }
};
