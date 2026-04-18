import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { BaseController } from '../../common/controller/BaseController';
import { IUser } from '../interfaces/IUser';
import UserService from '../services/UserService';
import { commonMessages } from '../../common/constants/message';
import { ErrorResponseHandler } from '../../common/response/errorResponse';
import { USER_TYPES } from '../../common/constants/common';
import { messages } from '../message';
import { SuccessResponseHandler } from '../../common/response/successResponse';
import { PaginationOptions } from '../../common/constants/interface';
import CommonService from '../../common/services/CommonService';
import AuthSessionService from '../../auth/services/AuthSessionService';
import logger from '../../common/services/WinstonLogger';

export class WebUserController extends BaseController<IUser> {
    constructor() {
        super(UserService, 'User');
    }

    public async create(req: Request, res: Response) {
        try {
            let loggedInUser = req.user as IUser;
            const data = req.body;
            // if (data.type <= loggedInUser.type ||
            //     (loggedInUser.type !== USER_TYPES.MASTER_ADMIN)) {
            //     throw commonMessages.INSUFFICIENT_PERMISSION;
            // }

            if (loggedInUser.type !== USER_TYPES.MASTER_ADMIN && loggedInUser.type !== USER_TYPES.CUSTOMER) {
                throw commonMessages.INSUFFICIENT_PERMISSION;
            }
            req.body.parentId = loggedInUser._id;
            /* if (loggedInUser.type === USER_TYPES.ADMIN || data.type > USER_TYPES.ADMIN) {
                logger.info('super admin', { data: data.type, USER_TYPES.CLIENT, data.type <= USER_TYPES.CLIENT, data.type <= USER_TYPES.CLIENT && !data.superAdminId });
                if (data.type >= USER_TYPES.CLIENT && !data.adminId) {
                    throw messages.ADMIN_REQUIRED;
                } else if (PROJECT_CONFIG.IS_CLIENT_REQUIRED && data.type >= USER_TYPES.STAFF && !data.clientId) {
                    throw messages.CLIENT_REQUIRED;
                }
            }
            if (!data.adminId) {
                delete data.adminId;
            }
            if (!data.clientId) {
                delete data.userAdminId;
            }
            if (!data.staffId) {
                delete data.staffId;
            } */

            super.create(req, res);
        } catch (error: any) {
            ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async update(req: Request, res: Response) {
        try {
            let loggedInUser = req.user as IUser;
            const userId: string = req.params.id;
            const dataToUpdate: Partial<IUser> = req.body;

            const user = await UserService.findById(userId);
            if (!user) {
                throw messages.USER_NOT_FOUND;
            }
            // if (user.type === USER_TYPES.USER && dataToUpdate.accessPermission && dataToUpdate.accessPermission.length) {
            //     throw messages.USER_ROLES_CAN_NOT_UPDATE;
            // }

            const updatedUser = await UserService.update(userId, dataToUpdate, loggedInUser);
            if (!updatedUser) {
                throw messages.USER_NOT_FOUND;
            }

            await CommonService.uploadActivityLogTos3(updatedUser, 'User', 'UPDATE');

            SuccessResponseHandler.sendSuccessResponse(res, messages.UPDATE_SUCCESSFULLY, updatedUser);
        } catch (error: any) {
            logger.info('user-update error', { data: error });
            ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async resetPassword(req: Request, res: Response) {
        try {
            let params = req.body;
            let id = params.id;
            let user = await UserService.findById(id) as IUser;

            if (!user || !user._id) {
                throw messages.USER_NOT_FOUND;
            }

            let newPassword = params.newPassword;
            newPassword = await bcrypt.hash(newPassword, 10);

            let updatedUser = await UserService.update(
                user.id,
                {
                    password: newPassword
                }
            );
            logger.info('resetPassword updatedUser -----------------', { data: updatedUser });

            if (!updatedUser || !updatedUser._id) {
                throw messages.USER_NOT_FOUND;
            }

            return SuccessResponseHandler.sendSuccessResponse(res, messages.PASSWORD_UPDATE_SUCCESSFULLY, updatedUser);
        } catch (error: any) {
            ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async downloadReport(req: Request, res: Response) {
        let params = req.body;

        let populateFields = [
            'parentId'
        ];
        let selectFields = [
            'name',
            'email',
            'mobile',
            'countryCode',
            'parentId'
        ];

        super.downloadReportData(req, res, params, selectFields, populateFields);
    }

    public async list(req: Request, res: Response) {
        try {
            let params = req.body;

            let filter: any = {};
            let options = {
                selectFields: [
                    // 'name',
                    // 'type'
                ]
            };
            if (params.filter) {
                Object.assign(filter, req.body.filter);
            }
            if (filter.type && (
                (Array.isArray(filter.type) && filter.type.length && filter.type.includes(USER_TYPES.MASTER_ADMIN))
            )) {
                filter.type = filter.type.filter((type: number) => type !== USER_TYPES.MASTER_ADMIN);
            }

            if (
                (!filter.type || (Array.isArray(filter.type) && filter.type.length === 0)) ||
                (filter.type && filter.type === USER_TYPES.MASTER_ADMIN)
            ) {
                filter.type = {
                    '$nin': [
                        USER_TYPES.MASTER_ADMIN
                    ]
                };
            }
            // Apply `isAccessRole` filter only if it's provided
            if (filter.isAccessRole && Array.isArray(filter.isAccessRole) && filter.isAccessRole.length) {
                filter.isAccessRole = { $in: filter.isAccessRole };
            }

            let users = await UserService.findByFilter(filter, options) as IUser[];

            if (!users || !users.length) {
                throw messages.USER_NOT_FOUND;
            }

            return SuccessResponseHandler.sendSuccessResponse(res, messages.OK, users);
        } catch (error: any) {
            ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async getDetailViewById(req: Request, res: Response): Promise<any> {
        try {
            let userId = req.params.id;
            let options: PaginationOptions = {
                populateFields: [
                    'parentId',
                ],
                selectFields: [
                    'name',
                    'type',
                    'countryCode',
                    'mobile',
                    'email',
                    'uniqueCode',
                    'parentId',
                    'isActive',
                    'isDeleted',
                    'parentId.name',
                    'parentId.countryCode',
                    'parentId.mobile',
                    'parentId.email',
                    'parentId.uniqueCode',
                    'parentId.image',
                ]
            };
            let user: any = await UserService.findById(userId, options);

            if (!user || !user._id) {
                throw messages.USER_NOT_FOUND;
            }

            return SuccessResponseHandler.sendSuccessResponse(res, messages.OK, user);
        } catch (error: any) {
            ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async myProfile(req: Request, res: Response) {
        logger.info('myProfile *******');
        try {
            let loggedInUser = req.user as IUser;
            logger.info('myProfile loggedInUser', { data: loggedInUser._id });
            let user = await UserService.getUserProfile(loggedInUser);

            return SuccessResponseHandler.sendSuccessResponse(res, messages.FETCH_SUCCESSFULLY, user);
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async paginate(req: Request, res: Response): Promise<void> {
        try {
            const paginatedData = await this.getPaginatedData(req);

            if (paginatedData.data && paginatedData.data.length > 0) {
                const userIds = paginatedData.data.map((user: any) => user._id.toString());
                const sessionCounts = await AuthSessionService.getSessionCountsForUsers(userIds);

                // Map counts to users
                paginatedData.data = paginatedData.data.map((user: any) => {
                    const userObj = user.toObject ? user.toObject() : JSON.parse(JSON.stringify(user));
                    const counts = sessionCounts.find((c: any) => c._id.toString() === user._id.toString());

                    userObj.sessionSummary = {
                        active: counts?.activeSessions || 0,
                        revoked: counts?.revokedSessions || 0
                    };
                    return userObj;
                });
            }

            SuccessResponseHandler.sendSuccessResponse(res, commonMessages.FETCH_SUCCESSFULLY, paginatedData);
        } catch (error: any) {
            logger.info('User paginate error', { data: error });
            ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }
}
