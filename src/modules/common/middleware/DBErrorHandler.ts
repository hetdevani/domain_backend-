import logger from '../services/WinstonLogger';

class DBErrorHandler {

    static getFieldLabel(fieldName: string): string {
        // This can be enhanced to make field names user-friendly
        // e.g., map 'first_name' to 'First Name' or similar logic.
        return fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    }

    static getErrorMessageForDuplicateKey(error: any): object {
        logger.info('getErrorMessageForDuplicateKey error', { data: error });
        const keyPattern = error.keyPattern;
        const keyValue = error.keyValue;
        let msg = 'Duplicate key error.';

        if (keyPattern && keyValue) {
            logger.info('keyPattern ***', { data: keyPattern, keyValue });
            const uniqueFields = Object.keys(keyPattern);
            logger.info('uniqueFields ***', { data: uniqueFields });
            if (uniqueFields.length === 1) {
                const fieldName = uniqueFields[0];
                const fieldLabel = this.getFieldLabel(fieldName);
                const duplicateValue = keyValue[fieldName];
                logger.info('fieldName ***', { data: fieldName, fieldLabel, duplicateValue });
                msg = `The ${fieldLabel} '${duplicateValue}' is already in use.`;
            }
        } else {
            const duplicateKeyInfo = error.message.match(/index: (.+?) dup key/);
            const duplicateValueInfo = error.message.match(/dup key: { : "(.+?)" }/);
            if (duplicateKeyInfo && duplicateKeyInfo.length > 1 && duplicateValueInfo && duplicateValueInfo.length > 1) {
                const keyDetails = duplicateKeyInfo[1].trim();
                const duplicateKey = keyDetails.split('_')[0];

                const duplicateValue = duplicateValueInfo[1].trim();
                msg = `The ${duplicateKey} '${duplicateValue}' is already in use.`;
            }
        }

        let errorMessageObj = {
            code: 'UNPROCESSABLE_ENTITY',
            status: 422,
            message: msg
        };

        return errorMessageObj;
    }

    static getErrorMessageForValidationError(error: any): object {
        // Mongoose validation errors have details in the 'errors' field
        const errors = error.errors;
        const errorMessages = [];

        for (let field in errors) {
            if (errors[field].message) {
                errorMessages.push(errors[field].message);
            }
        }

        let errorMessageObj = {
            code: 'UNPROCESSABLE_ENTITY',
            status: 422,
            message: errorMessages.join(", ")
        };

        return errorMessageObj;
    }

    static getErrorMessageForCastError(error: any): object {
        // Handle errors where Mongoose failed to convert a data type
        let errorMessageObj = {
            code: 'UNPROCESSABLE_ENTITY',
            status: 422,
            message: `Invalid value for field ${error.path}: ${error.value}`
        };

        return errorMessageObj;
    }

    static getErrorMessageForGeneralError(error: any): object {
        // Handle other types of errors or return a generic error message
        let message = `An unexpected error occurred.`;
        if (error && error.code && error.message) {
            message = error.message;
        }
        let errorMessageObj = {
            code: 'UNPROCESSABLE_ENTITY',
            status: 422,
            message: message
        };

        return errorMessageObj;
    }

    static handleError(error: any): object | undefined {
        logger.info('handleError error', { data: error });
        switch (error.name) {
            case 'MongoServerError':
                if (error.code === 11000) {
                    return this.getErrorMessageForDuplicateKey(error);
                }
                break;
            case 'ValidationError':
                return this.getErrorMessageForValidationError(error);
            case 'CastError':
                return this.getErrorMessageForCastError(error);
            default:
                return this.getErrorMessageForGeneralError(error);
        }
    }
}

export default DBErrorHandler;