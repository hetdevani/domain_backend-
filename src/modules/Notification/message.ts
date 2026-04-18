export const messages = {
    OK: {
        code: 'OK',
        message: 'OK.',
        status: 200
    },
    UPDATE_FAILED: {
        code: 'E_INTERNAL_SERVER_ERROR',
        message: 'Failed to update.',
        status: 401,
    },
    NOT_FOUND: {
        code: 'E_NOT_FOUND',
        message: 'Notification not found.',
        status: 404,
    },
    ALREADY_READ: {
        code: 'E_BAD_REQUEST',
        message: 'Notification already read.',
        status: 400,
    },
    ALREADY_READ_ALL: {
        code: 'E_BAD_REQUEST',
        message: 'All notification already read.',
        status: 400,
    },
}
