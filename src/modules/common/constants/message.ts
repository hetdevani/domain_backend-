export const commonMessages = {
    CREATED_SUCCESSFULLY: {
        code: 'CREATED_SUCCESSFULLY',
        message: '$moduleName created successfully.',
        status: 201,
    },
    FETCH_SUCCESSFULLY: {
        code: 'FETCH_SUCCESSFULLY',
        message: '$moduleName fetched successfully.',
        status: 200,
    },
    UPDATE_SUCCESSFULLY: {
        code: 'UPDATE_SUCCESSFULLY',
        message: '$moduleName updated successfully.',
        status: 200,
    },
    SEQUENCE_UPDATE_SUCCESSFULLY: {
        code: 'UPDATE_SUCCESSFULLY',
        message: '$moduleName sequence updated successfully.',
        status: 200,
    },
    NOT_FOUND: {
        code: 'NOT_FOUND',
        message: '$moduleName not found.',
        status: 404,
    },
    ACTIVATED_SUCCESSFULLY: {
        code: 'ACTIVATED_SUCCESSFULLY',
        message: '$moduleName activated successfully.',
        status: 200,
    },
    DEACTIVATED_SUCCESSFULLY: {
        code: 'DEACTIVATED_SUCCESSFULLY',
        message: '$moduleName deactivated successfully.',
        status: 200,
    },
    SOFT_DELETED_SUCCESSFULLY: {
        code: 'SOFT_DELETED_SUCCESSFULLY',
        message: '$moduleName soft deleted successfully.',
        status: 200,
    },
    MISSING_TOKEN: {
        code: 'MISSING_TOKEN',
        message: 'Unauthorized: Missing token.',
        status: 422,
    },
    INVALID_TOKEN: {
        code: 'E_UNAUTHORIZED',
        message: 'Unauthorized: Invalid token.',
        status: 401,
    },
    USER_NOT_FOUND: {
        code: 'E_UNAUTHORIZED',
        message: 'Unauthorized: User not found.',
        status: 401,
    },
    USER_NOT_ACTIVE: {
        code: 'E_UNAUTHORIZED',
        message: 'Unauthorized: User is not Active, Please contact Admin.',
        status: 401,
    },
    INSUFFICIENT_PERMISSION: {
        code: 'INSUFFICIENT_PERMISSION',
        message: 'Forbidden: Insufficient permissions.',
        status: 422,
    },
    ALREADY_UPDATED: {
        code: 'ALREADY_UPDATED',
        message: 'Already updated.',
        status: 422
    },
    ALREADY_ACTIVATED: {
        code: 'ALREADY_ACTIVATED',
        message: 'Already activated.',
        status: 422
    },
    ALREADY_DEACTIVATED: {
        code: 'ALREADY_DEACTIVATED',
        message: 'Already deactivated.',
        status: 422
    },
    ALREADY_SOFT_DELETED: {
        code: 'NOT_FOUND',
        message: 'data not found.',
        status: 422
    },
    NOT_ACTIVE: {
        code: 'UNPROCESSABLE_ENTITY',
        message: 'data not active.',
        status: 401
    },
    TOO_MANY_REQUEST_FROM_SAME_IP: {
        code: 'E_BAD_REQUEST',
        message: 'You sent too many requests. Please wait a while then try again',
        status: 429
    },
    BAD_REQUEST: {
        code: 'E_BAD_REQUEST',
        message: 'Bad request.',
        status: 400
    },
    NOT_IN_HUB: {
        code: 'E_BAD_REQUEST',
        message: '$moduleName is not in the hub.',
        status: 422,
    },
    SERVER_ERROR: {
        code: 'E_INTERNAL_SERVER_ERROR',
        message: 'Internal server error.',
        status: 500
    },
    UNAUTHORIZED: {
        code: 'E_UNAUTHORIZED',
        message: 'You are not allowed to perform this action.',
        status: 401
    },
    VEHICLE_NOT_ASSIGNED: {
        code: 'E_BAD_REQUEST',
        message: 'Vehicle not assigned to the driver.',
        status: 422
    },
    VEHICLE_ALREADY_SCANNED: {
        code: 'E_BAD_REQUEST',
        message: 'Vehicle already scanned.',
        status: 422
    },
    CUSTOMER_NOT_ASSIGNED: {
        code: 'E_BAD_REQUEST',
        message: 'Driver customer mapping not found.',
        status: 422
    },
    USER_PUNCH_OUT: {
        code: 'E_BAD_REQUEST',
        message: 'You are punch out.',
        status: 422
    }
};
