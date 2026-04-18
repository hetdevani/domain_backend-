export const messages = {
    OK: {
        code: 'OK',
        message: 'OK.',
        status: 200
    },
    FILE_NOT_UPLOAD: {
        code: 'E_INTERNAL_SERVER_ERROR',
        message: 'File not upload.',
        status: 500
    },
    MODEL_NOT_FOUND: {
        code: 'E_NOT_FOUND',
        message: 'Model $moduleName not found.',
        status: 422
    },
    DATA_NOT_INSERT: {
        code: 'E_INTERNAL_SERVER_ERROR',
        message: 'Failed to create $moduleName',
        status: 422
    },
    FILE_DELETED_SUCCESSFULLY: {
        code: 'OK',
        message: 'File delete sucessfully.',
        status: 200
    },
    IMAGE_UPLOAD: {
        code: 'OK',
        message: 'File upload sucessfully.',
        status: 200
    },
}
