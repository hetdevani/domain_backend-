import { Response } from 'express';
import { SuccessResponse } from '../constants/interface';
import translatorService from './translatorService';
// import TranslatorService from '../services/translatorService';

export class SuccessResponseHandler {
    static sendSuccessResponse(res: Response, messageObj: SuccessResponse, data?: any) {
        const language = res.req.headers.language as string;
        const translatedData = translatorService.translateData(data, language);
        const translatedMessage = translatorService.translateMessage(messageObj.message, language);
        const successResponse: SuccessResponse = {
            ...messageObj,
            message: translatedMessage,
            data: translatedData || undefined,
        };
        return res.status(messageObj.status).json(successResponse);
    }
}
