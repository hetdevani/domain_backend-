import { Request, Response } from 'express';
import { IVersionManager } from '../interfaces/IVersionManager';
import VersionManagerService from '../services/VersionManagerService';
import { messages } from '../message';
import { SuccessResponseHandler } from '../../common/response/successResponse';
import { ErrorResponseHandler } from '../../common/response/errorResponse';

export class MobileVersionManagerController {

    public async getActiveVersionAPK(req: Request, res: Response) {
        try {            
            if (req.headers.operatingsystem) {
                const data = await VersionManagerService.findOne(req.headers?.operatingsystem);
                return SuccessResponseHandler.sendSuccessResponse(res, messages.OK, data);
            } else {

                const data = await VersionManagerService.findOne(1);
                return SuccessResponseHandler.sendSuccessResponse(res, messages.OK, data);
            }
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }
}
