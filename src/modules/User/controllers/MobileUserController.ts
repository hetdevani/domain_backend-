import { Request, Response } from 'express';
import _ from 'lodash';
import request from 'request';
import { IUser } from '../interfaces/IUser';
import UserService from '../services/UserService';
import { messages } from '../message';
import { SuccessResponseHandler } from '../../common/response/successResponse';
import { ErrorResponseHandler } from '../../common/response/errorResponse';
import { PaginationOptions } from '../../common/constants/interface';
import UserLogsService from '../services/UserLogsService';
import { commonMessages } from '../../common/constants/message';
import { PROJECT_CONFIG } from '../../common/config/ProjectConfig';
import CommonService from '../../common/services/CommonService';
import logger from '../../common/services/WinstonLogger';
export class MobileUserController {

    public async getUserProfileById(req: Request, res: Response) {
        try {
            logger.info('req.params', { data: req.params });
            const userId: string = req.params.id;
            let reqBody = req.body;

            let options: PaginationOptions = {
                populateFields: reqBody.populateFields ? reqBody.populateFields : []
            };

            const user = await UserService.findById(userId, options);
            if (!user) {
                throw messages.USER_NOT_FOUND;
            }
            return SuccessResponseHandler.sendSuccessResponse(res, messages.FETCH_SUCCESSFULLY, user);
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async updateProfile(req: Request, res: Response) {
        try {
            const loggedInUser = req.user as IUser;

            const userId: string = loggedInUser._id;
            const updatedData: Partial<IUser> = req.body;

            const user = await UserService.findById(userId);
            if (!user) {
                throw messages.USER_NOT_FOUND;
            }

            if (updatedData.accessPermission && updatedData.accessPermission.length) {
                throw messages.USER_ROLES_CAN_NOT_UPDATE;
            }

            const updatedUser = await UserService.update(userId, updatedData);
            if (!updatedUser) {
                throw messages.USER_NOT_FOUND;
            }

            await CommonService.uploadActivityLogTos3(updatedUser, 'User', 'UPDATE');

            return SuccessResponseHandler.sendSuccessResponse(res, messages.PROFILE_UPDATE_SUCCESSFULLY, updatedUser);
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async sync(req: Request, res: Response) {
        try {
            let loggedInUser = req.user as IUser;
            let lastSyncDate = req.body.lastSyncDate;

            let syncData = await UserService.sync(loggedInUser, lastSyncDate);

            let reqIp = req?.ip?.split(':') || [];
            let userLogsData = {
                ip: reqIp[3] || '',
                userId: loggedInUser._id,
                apiName: 'userSync'
            };

            await UserLogsService.create(userLogsData);
            return SuccessResponseHandler.sendSuccessResponse(res, messages.OK, syncData);
        } catch (error: any) {
            logger.info('error:', { data: error });
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async myProfile(req: Request, res: Response) {
        logger.info('myProfile');
        try {
            let loggedInUser = req.user as IUser;
            let user = await UserService.getUserProfile(loggedInUser);

            return SuccessResponseHandler.sendSuccessResponse(res, messages.FETCH_SUCCESSFULLY, user);
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async userLocation(req: Request, res: Response) {
        try {
            let params = req.body;
            let loggedInUser = req.user as IUser;
            let reqIp = req?.ip?.split(':') || [];

            let userLogsData = {
                ip: reqIp[3],
                userId: loggedInUser._id,
                userLocation: params.userLocation,
                apiName: 'userLocation'
            };

            const data = await UserLogsService.create(userLogsData);

            return SuccessResponseHandler.sendSuccessResponse(res, messages.OK, data);
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async notificationIdentifierUpsert(req: Request, res: Response) {
        try {
            let playerId = req.headers.playerid as string;
            let deviceType = Number(req.headers.devicetype as string);
            let loginUser = req.user as IUser;
            if (!playerId || !deviceType || !loginUser) {
                throw commonMessages.BAD_REQUEST;
            }
            let response = await UserService.notificationIdentifierUpsert(playerId, deviceType, loginUser);
            if (!response) {
                throw commonMessages.SERVER_ERROR;
            }

            return SuccessResponseHandler.sendSuccessResponse(res, messages.OK, {});
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async googleDirection(req: Request, res: Response) {
        try {
            let params = req.body;

            let origin = params.origin;
            let destination = params.destination;
            const mode = params.mode;
            if (!origin.includes(',')) {
                origin = `place_id:${origin}`;
                destination = `place_id:${destination}`;
            }
            const googleApiKey = PROJECT_CONFIG.GOOGLE_API_KEY;
            const baseUrl = 'https://maps.googleapis.com/maps/api/directions/json';
            const url = `${baseUrl}?origin=${origin}&destination=${destination}&mode=${mode}&key=${googleApiKey}`;
            let response: any = await new Promise((resolve, reject) => {
                const options = {
                    url: url,
                    method: 'get'
                };

                request(options, (error: any, response: any, body: any) => {
                    resolve(body);
                });
            });
            response = JSON.parse(response);

            return SuccessResponseHandler.sendSuccessResponse(res, messages.OK, response);
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }
}
