import { Types } from 'mongoose';
import AuthSessionDAO from '../dao/AuthSessionDAO';
import { IAuthSession } from '../interfaces/IAuthSession';
import { AuthSession } from '../models/AuthSession';
import crypto from 'crypto';
import logger from '../../common/services/WinstonLogger';

export class AuthSessionService {
    public async createSession(userId: string, ipAddress?: string, userAgent?: string): Promise<IAuthSession> {
        const refreshToken = crypto.randomBytes(40).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 days refresh token

        logger.info('Creating session for user:', { data: userId });
        const session = await AuthSessionDAO.create({
            userId: new Types.ObjectId(userId),
            refreshToken,
            ipAddress,
            userAgent,
            expiresAt,
            isActive: true,
            lastAccessedAt: new Date()
        } as any);
        logger.info('Session created:', { data: session._id });

        return session;
    }

    public async validateRefreshToken(refreshToken: string): Promise<IAuthSession | null> {
        const session = await AuthSessionDAO.findOne({
            refreshToken,
            isActive: true,
            expiresAt: { $gt: new Date() }
        });

        if (session) {
            session.lastAccessedAt = new Date();
            await session.save();
        }

        return session;
    }

    public async revokeSession(refreshToken: string): Promise<void> {
        await AuthSessionDAO.updateOne({ refreshToken }, { isActive: false });
    }

    public async revokeSessionById(id: string): Promise<void> {
        await AuthSessionDAO.updateOne({ _id: new Types.ObjectId(id) }, { isActive: false });
    }

    public async revokeAllUserSessions(userId: string): Promise<void> {
        await AuthSessionDAO.updateMany({ userId: new Types.ObjectId(userId) }, { isActive: false });
    }

    public async getSessionById(id: string): Promise<IAuthSession | null> {
        return await AuthSessionDAO.findById(id);
    }

    public async getUserSessions(userId: string): Promise<IAuthSession[]> {
        return await AuthSessionDAO.find({ userId: new Types.ObjectId(userId), isActive: true });
    }

    public async getSessionCountsForUsers(userIds: string[]): Promise<any> {
        return await AuthSession.aggregate([
            { $match: { userId: { $in: userIds.map(id => new Types.ObjectId(id)) } } },
            {
                $group: {
                    _id: "$userId",
                    activeSessions: { $sum: { $cond: ["$isActive", 1, 0] } },
                    revokedSessions: { $sum: { $cond: ["$isActive", 0, 1] } }
                }
            }
        ]);
    }
}

export default new AuthSessionService();
