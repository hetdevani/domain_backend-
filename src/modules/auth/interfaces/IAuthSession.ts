import { Document, Types } from 'mongoose';

export interface IAuthSession extends Document {
    userId: Types.ObjectId;
    refreshToken: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
    isActive: boolean;
    lastAccessedAt: Date;
}
