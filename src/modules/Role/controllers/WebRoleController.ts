import { Request, Response } from 'express';
import { messages } from '../../common/config/message';
import { BaseController } from '../../common/controller/BaseController';
import { ErrorResponseHandler } from '../../common/response/errorResponse';
import { SuccessResponseHandler } from '../../common/response/successResponse';
import { IRole } from '../interfaces/IRole';
import RoleService from '../services/RoleService';
import { IUser } from '../../User/interfaces/IUser';
import logger from '../../common/services/WinstonLogger';

export class WebRoleController extends BaseController<IRole> {
    constructor() {
        super(RoleService, 'Role');
    }

    public async setDefaultRole(req: Request, res: Response) {
        try {
            let loggedInUser = req.user as IUser;
            const id: string = req.params.id;

            const updatedRole = await RoleService.setDefault(id, loggedInUser);
            if (!updatedRole) {
                throw messages.NOT_FOUND;
            }
            logger.info('updatedMaster --------------', { data: updatedRole });

            await RoleService.setDefaultRole(id, updatedRole.userType);

            return SuccessResponseHandler.sendSuccessResponse(res, messages.UPDATE_SUCCESSFULLY, {});
        } catch (error: any) {
            ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async update(req: Request, res: Response) {
        try {
            let loggedInUser = req.user as IUser;
            const id: string = req.params.id;
            let dataToUpdate: any = req.body;

            let isAppliedToAll = dataToUpdate.isAppliedToAll;
            delete dataToUpdate.isAppliedToAll;

            const updatedRole = await RoleService.update(id, dataToUpdate, loggedInUser);
            if (!updatedRole) {
                throw messages.NOT_FOUND;
            }
            if (isAppliedToAll) {
                await RoleService.updatePermissionsToAllUsers(updatedRole.userType, dataToUpdate.permissions);
            }

            SuccessResponseHandler.sendSuccessResponse(res, messages.UPDATE_SUCCESSFULLY, {});
        } catch (error: any) {
            logger.info('role-update error', { data: error });
            ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }
}

export default new WebRoleController();
