import { Request, Response } from 'express';
import { BaseController } from '../../common/controller/BaseController';
import { ErrorResponseHandler } from '../../common/response/errorResponse';
import { INotification } from '../interfaces/INotification';
import NotificationService from '../services/NotificationService';
import { NOTIFICATION_STATUS } from '../../common/constants/common';
import { SuccessResponseHandler } from '../../common/response/successResponse';
import { messages } from '../message';
import logger from '../../common/services/WinstonLogger';

export class WebNotificationController extends BaseController<INotification> {
    constructor() {
        super(NotificationService, 'Notification');
    }

    public async paginate(req: Request, res: Response) {
        try {
            let loggedInUser = req.user as any;
            req.body.filter.userId = loggedInUser._id.toString();

            logger.info('paginate req.body', { data: req.body });
            let response: any = await NotificationService.paginateWithOptionsAndFilters(req);
            response.unreadNotificationsCount = await NotificationService.unreadNotificationsCount(loggedInUser._id);

            SuccessResponseHandler.sendSuccessResponse(res, messages.OK, response);
        } catch (error: any) {
            ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async read(req: Request, res: Response) {
        try {
            let loggedInUser = req.user as any;

            let notification = await NotificationService.findById(req.params.id);
            if (!notification || !notification._id) {
                throw messages.NOT_FOUND;
            }
            if (notification.status === NOTIFICATION_STATUS.READ) {
                throw messages.ALREADY_READ;
            }

            let updatedData: any = {
                status: NOTIFICATION_STATUS.READ,
                updatedBy: loggedInUser._id
            };

            let response = await NotificationService.update(req.params.id, updatedData);
            logger.info('read response', { data: response });

            if (!response || !response._id) {
                throw messages.UPDATE_FAILED;
            }

            await NotificationService.sendUnreadNotificationsCount(loggedInUser._id);
            return SuccessResponseHandler.sendSuccessResponse(res, messages.OK, {});
        } catch (error: any) {
            ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async readAll(req: Request, res: Response) {
        try {
            let loggedInUser = req.user as any;
            let filter = {
                userId: loggedInUser._id,
                status: NOTIFICATION_STATUS.UNREAD
            };

            logger.info('paginate req.body', { data: req.body });

            let notifications = await NotificationService.find(filter);

            if (!notifications || !notifications.length) {
                throw messages.ALREADY_READ_ALL;
            }

            let updatedData: any = {
                status: NOTIFICATION_STATUS.READ,
                updatedBy: loggedInUser._id
            };

            await NotificationService.updateMany(filter, updatedData);

            await NotificationService.sendUnreadNotificationsCount(loggedInUser._id);
            return SuccessResponseHandler.sendSuccessResponse(res, messages.OK, {});
        } catch (error: any) {
            ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async unReadCount(req: Request, res: Response) {
        try {
            let loggedInUser = req.user as any;

            let response = {
                unreadNotificationsCount: 0
            };

            response.unreadNotificationsCount = await NotificationService.unreadNotificationsCount(loggedInUser._id);

            return SuccessResponseHandler.sendSuccessResponse(res, messages.OK, response);
        } catch (error: any) {
            ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async getCount(req: Request, res: Response) {
        try {
            let loggedInUser = req.user as any;

            let unreadFilter = {
                userId: loggedInUser._id,
                status: NOTIFICATION_STATUS.UNREAD
            };
            let unreadNotificationsCount = await NotificationService.getCount(unreadFilter);

            let readFilter = {
                userId: loggedInUser._id,
                status: NOTIFICATION_STATUS.READ
            };
            let readNotificationsCount = await NotificationService.getCount(readFilter);

            let totalCount = await NotificationService.getCount({ userId: loggedInUser._id });

            let response = {
                totalCount: totalCount,
                readNotificationsCount: readNotificationsCount,
                unreadNotificationsCount: unreadNotificationsCount
            };

            return SuccessResponseHandler.sendSuccessResponse(res, messages.OK, response);
        } catch (error: any) {
            ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }
}
