import { IUser } from "../../User/interfaces/IUser";
import UserService from "../../User/services/UserService";
import { commonMessages } from "../../common/constants/message";
import { JWTUtil } from "../utils/JWTUtil";
import logger from '../../common/services/WinstonLogger';

export class AuthService {

    public async validateToken(token: string, isCheckPermission: boolean = true): Promise<IUser> {
        token = token.replace('Bearer ', '');

        if (!token) {
            throw commonMessages.MISSING_TOKEN;
        }

        if (JWTUtil.isBlacklisted(token)) {
            throw commonMessages.INVALID_TOKEN;
        }

        const decodedToken = JWTUtil.verifyToken(token);
        if (!decodedToken) {
            throw commonMessages.INVALID_TOKEN;
        }

        const payload = decodedToken as { userId: string; sessionId?: string; };
        const userId = payload.userId;
        const sessionId = payload.sessionId;

        // Instant Revocation Check:
        // If the token has a sessionId, verify that the session is still active in the DB
        if (sessionId) {
            const AuthSessionService = (await import('./AuthSessionService')).default;
            const session = await AuthSessionService.getSessionById(sessionId);
            if (!session || !session.isActive) {
                logger.info('Session ${sessionId} is revoked or inactive. Rejecting token.');
                throw commonMessages.INVALID_TOKEN;
            }
        }

        const user: IUser | null = await UserService.findById(userId);
        logger.info('user userId', { data: user && user['name' as keyof IUser] });

        if (!user) {
            throw commonMessages.USER_NOT_FOUND;
        }
        if (!user.isActive) {
            throw commonMessages.USER_NOT_ACTIVE;
        }
        if (user.isDeleted) {
            throw commonMessages.USER_NOT_FOUND;
        }
        if (isCheckPermission && !user.type) {
            throw commonMessages.INSUFFICIENT_PERMISSION;
        }

        return user;
    }
}

export default new AuthService();