import { Request, Response } from 'express';
import { BaseController } from '../../common/controller/BaseController';
import { ErrorResponseHandler } from '../../common/response/errorResponse';
import { SuccessResponseHandler } from '../../common/response/successResponse';
import { ISetting } from '../interfaces/ISetting';
import { messages } from '../message';
import SettingService from '../services/SettingService';

export class WebSettingController extends BaseController<ISetting> {
    constructor() {
        super(SettingService, 'Setting');
    }

    public async getByType(req: Request, res: Response) {
        const type = Number(req.params.type);
        try {

            let setting = await SettingService.findOne({ type: type });

            return SuccessResponseHandler.sendSuccessResponse(res, messages.OK, setting);
        } catch (error: any) {
            ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async updateByType(req: Request, res: Response) {
        const type = Number(req.params.type);
        const data = req.body;
        try {

            await SettingService.updateOne({ type: type }, data);
            let setting = await SettingService.findOne({ type: type });

            return SuccessResponseHandler.sendSuccessResponse(res, messages.OK, setting);
        } catch (error: any) {
            ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }
}
