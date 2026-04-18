import { Request, Response } from 'express';
import { BaseController } from '../../common/controller/BaseController';
import { IMaster } from '../interfaces/IMaster';
import MasterService from '../services/MasterService';
import { ErrorResponseHandler } from '../../common/response/errorResponse';
import { SuccessResponseHandler } from '../../common/response/successResponse';
import { messages } from '../message';
import { IUser } from '../../User/interfaces/IUser';
import logger from '../../common/services/WinstonLogger';

export class WebMasterController extends BaseController<IMaster> {
    constructor() {
        super(MasterService, 'Master');
    }

    public async setDefaultMaster(req: Request, res: Response) {
        try {
            let loggedInUser = req.user as IUser;
            const id: string = req.params.id;

            const updatedMaster = await MasterService.setDefault(id, loggedInUser);
            if (!updatedMaster) {
                throw messages.MASTER_NOT_FOUND;
            }
            logger.info('updatedMaster --------------', { data: updatedMaster });

            let filter = {
                _id: { '$ne': updatedMaster._id },
                parentId: updatedMaster.parentId
            };

            let updatedData = {
                isDefault: false
            };

            await MasterService.updateMany(filter, updatedData);

            return SuccessResponseHandler.sendSuccessResponse(res, messages.OK, {});
        } catch (error: any) {
            ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }
}
