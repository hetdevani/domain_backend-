import { Response } from 'express';
import { ErrorResponse } from '../constants/interface';
import translatorService from './translatorService'; // Make sure this path points to the correct location of your translatorService file

export class ErrorResponseHandler {
    static sendErrorResponse(res: Response, errorObj: ErrorResponse, data?: any) {
        const language = res.req.headers.language as string;

        const defaultError: ErrorResponse = {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
            status: 500,
        };

        // Translate the error message
        let translatedMessage = translatorService.translateMessage(errorObj.message, language);
        translatedMessage = translatedMessage.replace(/"/g, "'");

        const errorResponse: ErrorResponse = {
            ...defaultError,
            ...errorObj,
            message: translatedMessage.toString(), // Use the translated message
            data: data || undefined,
        };

        return res.status(errorResponse.status).json(errorResponse);
    }
}
