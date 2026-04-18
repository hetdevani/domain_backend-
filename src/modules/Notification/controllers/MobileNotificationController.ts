import { Request, Response } from 'express';
import { INotification } from '../interfaces/INotification';
import NotificationService from '../services/NotificationService';
import { messages } from '../message';
import { SuccessResponseHandler } from '../../common/response/successResponse';
import { ErrorResponseHandler } from '../../common/response/errorResponse';
import { IUser } from '../../User/interfaces/IUser';

export class MobileNotificationController {
    public async list(req: Request, res: Response) {
        try {
            const params = req.body;
            let loggedInUser = req.user as IUser;

            let filter: any = {
                userId: loggedInUser._id,
            };

            let options = {
                page: params.page || 1,
                limit: params.limit || 10,
                sortBy: { 'createdAt': -1 }
            };
            const data = await NotificationService.paginate(filter, options);

            return SuccessResponseHandler.sendSuccessResponse(res, messages.OK, data);
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }
}
