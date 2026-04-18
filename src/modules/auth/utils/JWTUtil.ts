import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { messages } from '../message';

dotenv.config(); // Load .env variables

export class JWTUtil {
    private static readonly jwtSecret: string = process.env.JWT_SECRET || 'default_secret';
    private static blacklistedTokens: Map<string, number> = new Map();

    static generateToken(userId: string, isAdmin: boolean = false, sessionId?: string): string {
        let expiresIn = process.env.USER_TOKEN_EXPIRES_IN || '1h';
        if (isAdmin) {
            expiresIn = process.env.ADMIN_TOKEN_EXPIRES_IN || '15m';
        }
        return jwt.sign({ userId, sessionId }, JWTUtil.jwtSecret, { expiresIn: JSON.parse(JSON.stringify(expiresIn)) });
    }

    static verifyToken(token: string): string | object {
        try {
            return jwt.verify(token, JWTUtil.jwtSecret);
        } catch (err) {
            throw messages.INVALID_TOKEN;
        }
    }

    static addToBlacklist(token: string): void {
        const expiryTime = Date.now(); // Expire immediately
        JWTUtil.blacklistedTokens.set(token, expiryTime);

        // Clean up expired tokens
        for (const [token, expiry] of JWTUtil.blacklistedTokens.entries()) {
            if (expiry < Date.now()) {
                JWTUtil.blacklistedTokens.delete(token);
            }
        }
    }

    static isBlacklisted(token: string): boolean {
        let currentDate = Date.now();
        currentDate = JSON.parse(JSON.stringify(currentDate));
        const expiryTime = JWTUtil.blacklistedTokens.get(token);
        if (!expiryTime) return false;

        if (expiryTime < currentDate) {
            JWTUtil.blacklistedTokens.delete(token);
            return true;
        }

        return false;
    }
}
