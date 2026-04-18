import { BaseController } from '../../common/controller/BaseController';
import { IVersionManager } from '../interfaces/IVersionManager';
import VersionManagerService from '../services/VersionManagerService';
import { SuccessResponseHandler } from '../../common/response/successResponse';
import { ErrorResponseHandler } from '../../common/response/errorResponse';
import { Request, Response } from 'express';
import { messages } from '../message';
import logger from '../../common/services/WinstonLogger';


export class WebVersionManagerController extends BaseController<IVersionManager> {
    constructor() {
        super(VersionManagerService, 'VersionManager');
    }

    public async activateStatus(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const data = await VersionManagerService.activeStatus(id);

            return SuccessResponseHandler.sendSuccessResponse(res, messages.OK, data);
        }
        catch (error: any) {
            logger.info('VersionManager-status-update error', { data: error });
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async getTicketsCount(req: Request, res: Response) {
        try {

            const totalCount = await VersionManagerService.getCount({});
            const windowsCount = await VersionManagerService.getCount({ operatingSystem: 1});
            const linuxCount = await VersionManagerService.getCount({ operatingSystem: 2 });

            const response = {
                totalCount: totalCount,
                windowsCount: windowsCount,
                linuxCount: linuxCount,
            }

            return SuccessResponseHandler.sendSuccessResponse(res, messages.OK, response)


        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }
}
