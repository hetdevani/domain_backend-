export const messages = {
    OK: {
        code: 'OK',
        message: 'Operation successfully executed.',
        status: 200,
    },
    SIGN_UP: {
        code: 'OK',
        message: 'Signup successfully. Please wait for admin approval.',
        status: 201
    },
    FETCH_SUCCESSFULLY: {
        code: 'OK',
        message: 'User fetched successfully',
        status: 200,
    },
    PROFILE_UPDATE_SUCCESSFULLY: {
        code: 'OK',
        message: 'Profile updated successfully.',
        status: 200,
    },
    LOGIN_FIRST: {
        code: 'E_BAD_REQUEST',
        message: 'Please log in before signing up.',
        status: 422,
    },
    INVALID_OTP: {
        code: 'E_BAD_REQUEST',
        message: 'Invalid otp.',
        status: 422,
    },
    USER_NOT_FOUND: {
        code: 'E_NOT_FOUND',
        message: 'User not found.',
        status: 404,
    },
    EMAIL_NOT_VERIFIED: {
        code: 'E_BAD_REQUEST',
        message: 'Email is not verified for this user.',
        status: 422,
    },
    OTP_EXPIRE: {
        code: 'E_BAD_REQUEST',
        message: 'Your OTP has expired. Please request a new one.',
        status: 422
    },
    ADMIN_REQUIRED: {
        code: 'E_BAD_REQUEST',
        message: 'Admin is required.',
        status: 422,
    },
    CLIENT_REQUIRED: {
        code: 'E_BAD_REQUEST',
        message: 'Client is required.',
        status: 422,
    },
    USER_REQUIRED: {
        code: 'E_BAD_REQUEST',
        message: 'User is required.',
        status: 422,
    },
    PASSWORD_UPDATE_SUCCESSFULLY: {
        code: 'OK',
        message: 'Password updated successfully.',
        status: 200,
    },
    USER_NOT_REGISTER: {
        code: 'E_BAD_REQUEST',
        message: 'User not register.',
        status: 422,
    },
    ALREADY_PUNCH_IN: {
        code: 'E_BAD_REQUEST',
        message: 'You are already punch in. Please punch out first.',
        status: 422,
    },
    NOT_IN_HUB: {
        code: 'E_BAD_REQUEST',
        message: 'You are not in hub.',
        status: 422,
    },
    PUNCH_DATA_NOT_FOUND: {
        code: 'E_BAD_REQUEST',
        message: 'Punchin details not found. Please punch in first',
        status: 422,
    },
    VEHICLE_NOT_LOCKED: {
        code: 'E_BAD_REQUEST',
        message: 'Vehicle not locked. Please locked vehicle first before punch out.',
        status: 422,
    },
    PUNCH_OUT_FAILED: {
        code: 'E_BAD_REQUEST',
        message: 'Punch out failed.',
        status: 422,
    },
    DRIVER_ALREADY_EXIST: {
        code: 'E_BAD_REQUEST',
        message: 'Driver already exist with this mobile number.',
        status: 422,
    },
    UNAUTHORIZED: {
        code: 'E_UNAUTHORIZED',
        message: 'You are not authorized to access this resource.',
        status: 401,
    },
    RETAIN_VEHICLE: {
        code: 'E_BAD_REQUEST',
        message: 'You cannot punch-out without lock vehicle into hub.',
        status: 422,
    },
    PARCEL_NOT_DELIVERED: {
        code: 'E_BAD_REQUEST',
        message: 'You can not punchout without delivered parcel.',
        status: 422,
    },
    SINGLE_PUNCH_IN_PER_DAY: {
        code: 'E_BAD_REQUEST',
        message: 'You can punch in only once per day.',
        status: 422,
    },
    PUNCH_OUT_WITHOUT_VEHICLE: {
        code: 'E_BAD_REQUEST',
        message: 'You can not punch out during change vehicle process. Please complete change vehicle process first.',
        status: 422,
    },
    USER_ROLES_CAN_NOT_UPDATE: {
        code: 'E_BAD_REQUEST',
        message: 'User roles can not update.',
        status: 422,
    },
    USER_NOT_CREATED: {
        code: 'E_INTERNAL_SERVER_ERROR',
        message: 'Failed to create user',
        status: 422
    },
    UPDATE_SUCCESSFULLY: {
        code: 'OK',
        message: 'Updated successfully.',
        status: 200
    },
    EMAIL_REGISTERED: {
        code: 'E_DUPLICATE',
        message: 'Email already registered.',
        status: 200
    },
    MOBILE_REGISTERED: {
        code: 'E_DUPLICATE',
        message: 'Mobile already registered.',
        status: 200
    },
    TECHNICIAN_NOT_FOUND: {
        code: 'E_TECHNICIAN_NOT_FOUND',
        message: 'Technician not found.',
        status: 404,
    },
    TECHNICIAN_STATUS_UPDATED: {
        code: 'E_TECHNICIAN_STATUS_UPDATED',
        message: 'Technician status already updated.',
        status: 404,
    }
};
