import { Request, Response } from 'express';
import { IAccountDeleteRequest } from '../interfaces/IAccountDeleteRequest';
import AccountDeleteRequestService from '../services/AccountDeleteRequestService';
import { messages } from '../message';
import { SuccessResponseHandler } from '../../common/response/successResponse';
import { ErrorResponseHandler } from '../../common/response/errorResponse';
import { IUser } from '../../User/interfaces/IUser';
import { MomentUtils } from '../../common/utils/momentUtils';

export class MobileAccountDeleteRequestController {
    async requestForDeleteAccount(req: Request, res: Response) {
        try {
            let loggedInUser = req.user as IUser;

            // if (loggedInUser && loggedInUser.activeOrderId) {
            //     throw sails.config.message.CAN_NOT_DELETE_ACCOUNT_ON_ACTIVE_ORDER;
            // }

            let filter = {
                userId: loggedInUser._id,
            }

            let record = await AccountDeleteRequestService.findOne(filter);

            if (record && record._id) {
                throw messages.DUPLICATE_ACCOUNT_DELETE_REQUEST;
            }

            let createdData = {
                userId: loggedInUser._id,
                requestedDate: MomentUtils.getTimeFromNow(),
                message: 'Account delete request for customer.'
            };

            let createdRecord = await AccountDeleteRequestService.create(createdData);

            if (!createdRecord || !createdRecord._id) {
                throw messages.CREATE_FAILED;
            }

            return SuccessResponseHandler.sendSuccessResponse(res, messages.ACCOUNT_DELETE_REQUEST, createdRecord);
        } catch (error: any) {
            console.log('requestForDeleteAccount error:', error);
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }
}
