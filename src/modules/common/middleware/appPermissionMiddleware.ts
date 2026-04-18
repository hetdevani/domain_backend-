import { Request, Response, NextFunction } from 'express';
import { IUser } from '../../User/interfaces/IUser';
import { JWTUtil } from '../../auth/utils/JWTUtil';
import UserService from '../../User/services/UserService';
import { ErrorResponseHandler } from '../response/errorResponse';
import { commonMessages } from '../constants/message';
import logger from '../services/WinstonLogger';

export default class AppPermissionMiddleware {

    public checkAppPermission() {
        return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            try {
                await this.validateAppPermission(req, res, next);
            } catch (error: any) {
                logger.error('Error during app permission check:', { error: error });
                ErrorResponseHandler.sendErrorResponse(res, error);
            }
        };
    }

    private async validateAppPermission(req: Request, res: Response, next: NextFunction) {
        // Get JWT token from headers
        await this.validateTokenAndUser(req);
        next();
    }

    private async validateTokenAndUser(req: Request) {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            throw commonMessages.MISSING_TOKEN;
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
        logger.info('user userId----', { data: user && user['name' as keyof IUser] });

        if (!user) {
            throw commonMessages.USER_NOT_FOUND;
        }
        if (!user.isActive) {
            throw commonMessages.USER_NOT_ACTIVE;
        }
        if (user.isDeleted) {
            throw commonMessages.USER_NOT_FOUND;
        }
        if (!user.type) {
            throw commonMessages.INSUFFICIENT_PERMISSION;
        }

        req.user = user as IUser;
    }
}
