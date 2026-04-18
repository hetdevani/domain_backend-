import { Request, Response, NextFunction } from 'express';
import { IUser, PermissionModule, Permissions } from '../../User/interfaces/IUser';
import { JWTUtil } from '../../auth/utils/JWTUtil';
import UserService from '../../User/services/UserService';
import { ErrorResponseHandler } from '../response/errorResponse';
import { commonMessages } from '../constants/message';
import AuthService from '../../auth/services/AuthService';
import logger from '../services/WinstonLogger';

export default class PermissionMiddleware {
    private moduleNumber: number;

    constructor(moduleNumber: number) {
        this.moduleNumber = moduleNumber;
    }

    public checkPermission(requiredPermissions: keyof Permissions) {
        return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            try {
                await this.validatePermission(req, res, next, requiredPermissions);
            } catch (error: any) {
                logger.error('checkPermission Error during permission check:', { error: error });
                ErrorResponseHandler.sendErrorResponse(res, error);
            }
        };
    }

    public checkTokenWithoutPermission() {
        return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            try {
                await this.validateToken(req, res, next);
            } catch (error: any) {
                logger.error('Error during permission check:', { error: error });
                ErrorResponseHandler.sendErrorResponse(res, error);
            }
        };
    }

    private async validatePermission(req: Request, res: Response, next: NextFunction, requiredPermissions: keyof Permissions) {
        // Get JWT token from headers
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            throw commonMessages.MISSING_TOKEN;
        }

        if (JWTUtil.isBlacklisted(token)) {
            throw commonMessages.INVALID_TOKEN;
        }

        // Verify the JWT token
        const decodedToken = JWTUtil.verifyToken(token);

        if (!decodedToken) {
            throw commonMessages.INVALID_TOKEN;
        }

        // Get the user ID from the decoded token
        const userId = (decodedToken as { userId: string; }).userId;

        // Check if the user exists and is active
        const user: IUser | null = await UserService.findById(userId);
        if (!user) {
            throw commonMessages.USER_NOT_FOUND;
        }
        if (!user.isActive) {
            throw commonMessages.USER_NOT_ACTIVE;
        }
        if (user.isDeleted) {
            throw commonMessages.USER_NOT_FOUND;
        }

        // Check user permissions
        const isUserHasPermission = PermissionMiddleware.checkUserPermissions(
            user.accessPermission,
            this.moduleNumber,
            requiredPermissions
        );
        if (!isUserHasPermission) {
            throw commonMessages.INSUFFICIENT_PERMISSION;
        }
        req.user = user as IUser;
        // User has the required permissions, proceed to the next middleware/route handler
        next();
    }

    private static checkUserPermissions(
        accessPermission: PermissionModule[] | undefined,
        moduleNumber: number,
        requiredPermission: keyof Permissions
    ): boolean {
        if (!accessPermission) {
            return false;
        }
        const hasPermission = accessPermission.some((permission) => {
            return permission.module === moduleNumber && permission.permissions && permission.permissions[requiredPermission];
        });

        return hasPermission;
    }

    private async validateToken(req: Request, res: Response, next: NextFunction) {
        const token = req.headers.authorization;

        if (!token) {
            throw commonMessages.MISSING_TOKEN;
        }

        req.user = await AuthService.validateToken(token, false);
        next();
    }
}
