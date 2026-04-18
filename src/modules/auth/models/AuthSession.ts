import { Schema, model } from 'mongoose';
import { IAuthSession } from '../interfaces/IAuthSession';

const AuthSessionSchema: Schema<IAuthSession> = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        refreshToken: { type: String, required: true, unique: true },
        ipAddress: { type: String },
        userAgent: { type: String },
        expiresAt: { type: Date, required: true },
        isActive: { type: Boolean, default: true },
        lastAccessedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// Index for automatic deletion of expired sessions if we want (optional, but good for performance)
// AuthSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
AuthSessionSchema.index({ userId: 1 });
AuthSessionSchema.index({ refreshToken: 1 });

export const AuthSession = model<IAuthSession>('AuthSession', AuthSessionSchema);
