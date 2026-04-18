export const messages = {
    OK: {
        code: 'OK',
        message: 'OK.',
        status: 200
    },
    ACCOUNT_DELETE_REQUEST: {
        code: 'OK',
        message: 'Your account delete request has been send successfully.',
        status: 200
    },
    DUPLICATE_ACCOUNT_DELETE_REQUEST: {
        code: 'UNPROCESSABLE_ENTITY',
        message: 'You have already send request for delete account.',
        status: 422
    },
    CREATE_FAILED: {
        code: 'E_BAD_REQUEST',
        message: 'The request has not been fulfilled, Please try again',
        status: 422
    }
}
