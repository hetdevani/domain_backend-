import { Request, Response } from 'express';
import { IStaticPage } from '../interfaces/IStaticPage';
import StaticPageService from '../services/StaticPageService';
import { messages } from '../message';
import { SuccessResponseHandler } from '../../common/response/successResponse';
import { ErrorResponseHandler } from '../../common/response/errorResponse';
import logger from '../../common/services/WinstonLogger';

export class MobileStaticPageController {

    public async getPage(req: Request, res: Response) {
        try {
            const code = req.params.code;
            let filter = {
                code: code,
            }
            const data = await StaticPageService.findOne(filter);
            logger.info('data', { data: data });
            if (!data) {
                throw messages.NOT_FOUND;
            }

            return SuccessResponseHandler.sendSuccessResponse(res, messages.OK, data);
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }
}
