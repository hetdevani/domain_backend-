/**
 * Request Context Utility
 * Manage correlation IDs, trace IDs, and request info for tracking across services
 * Uses AsyncLocalStorage for access from anywhere without passing req object
 */

import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import logger from '../../common/services/WinstonLogger';

// Store for request context accessible anywhere
interface IRequestContext {
    correlationId: string;
    traceId: string;
    ipAddress: string;
    userAgent: string;
    method: string;
    url: string;
}

const asyncLocalStorage = new AsyncLocalStorage<IRequestContext>();

export class RequestContext {
    /**
     * Express middleware to attach correlation and trace IDs to requests
     * Also stores request info in AsyncLocalStorage for access anywhere
     * Usage: app.use(RequestContext.middleware);
     */
    static middleware(req: Request, res: Response, next: NextFunction): void {
        try {
            // Get or create correlation ID (tracks single request)
            const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();

            // Get or create trace ID (tracks request across multiple services)
            const traceId = (req.headers['x-trace-id'] as string) || uuidv4();

            // Get client IP address
            const ipAddress = RequestContext.extractIpAddress(req);

            // Get user agent
            const userAgent = (req.headers['user-agent'] as string) || 'unknown';

            // Attach to request object for easy access
            (req as any).correlationId = correlationId;
            (req as any).traceId = traceId;

            // Add to response headers so client can track
            res.setHeader('X-Correlation-ID', correlationId);
            res.setHeader('X-Trace-ID', traceId);

            // Store in AsyncLocalStorage for access from anywhere
            const context: IRequestContext = {
                correlationId,
                traceId,
                ipAddress,
                userAgent,
                method: req.method,
                url: req.originalUrl
            };

            asyncLocalStorage.run(context, () => {
                next();
            });
        } catch (error) {
            logger.error('Error in RequestContext middleware', { error });
            next();
        }
    }

    /**
     * Extract client IP address from request
     */
    private static extractIpAddress(req: Request): string {
        // Check common proxy headers
        const headers = [
            'x-forwarded-for',
            'x-real-ip',
            'x-client-ip',
            'cf-connecting-ip',
            'true-client-ip'
        ];

        for (const header of headers) {
            const value = req.headers[header];
            if (value) {
                const ip = (value as string).split(',')[0].trim();
                if (ip && ip !== 'unknown') {
                    return RequestContext.normalizeIp(ip);
                }
            }
        }

        // Fallback
        const ip = req.ip || req.socket?.remoteAddress || 'unknown';
        return RequestContext.normalizeIp(ip);
    }

    /**
     * Normalize IP address
     */
    private static normalizeIp(ip: string): string {
        // Handle IPv6-mapped IPv4
        if (ip.startsWith('::ffff:')) {
            ip = ip.substring(7);
        }

        // Normalize localhost
        if (ip === '::1' || ip === 'localhost') {
            return '127.0.0.1';
        }

        return ip;
    }

    /**
     * Get current request context from AsyncLocalStorage
     */
    static getContext(): IRequestContext | undefined {
        return asyncLocalStorage.getStore();
    }

    /**
     * Get IP address from current context
     */
    static getIpAddress(): string {
        return asyncLocalStorage.getStore()?.ipAddress || 'unknown';
    }

    /**
     * Get user agent from current context
     */
    static getUserAgent(): string {
        return asyncLocalStorage.getStore()?.userAgent || 'unknown';
    }

    /**
     * Get device info from current user agent
     */
    static getDeviceInfo(): any {
        const ua = RequestContext.getUserAgent();
        return RequestContext.parseUserAgent(ua);
    }

    /**
     * Get correlation ID from current context or request
     */
    static getCorrelationId(req?: Request): string {
        if (req) {
            return (req as any).correlationId || uuidv4();
        }
        return asyncLocalStorage.getStore()?.correlationId || uuidv4();
    }

    /**
     * Get trace ID from current context or request
     */
    static getTraceId(req?: Request): string {
        if (req) {
            return (req as any).traceId || uuidv4();
        }
        return asyncLocalStorage.getStore()?.traceId || uuidv4();
    }

    /**
     * Get method from context
     */
    static getMethod(): string {
        return asyncLocalStorage.getStore()?.method || 'unknown';
    }

    /**
     * Get URL from context
     */
    static getUrl(): string {
        return asyncLocalStorage.getStore()?.url || 'unknown';
    }

    /**
     * Parse user agent (Shared logic)
     */
    static parseUserAgent(userAgent: string): any {
        if (!userAgent || userAgent === 'unknown') return {};

        const deviceInfo: any = {};

        // Detect device type
        if (/mobile/i.test(userAgent)) {
            deviceInfo.type = 'mobile';
        } else if (/tablet|ipad/i.test(userAgent)) {
            deviceInfo.type = 'tablet';
        } else {
            deviceInfo.type = 'desktop';
        }

        // Detect OS
        if (/windows/i.test(userAgent)) {
            deviceInfo.os = 'Windows';
        } else if (/mac/i.test(userAgent)) {
            deviceInfo.os = 'macOS';
        } else if (/linux/i.test(userAgent)) {
            deviceInfo.os = 'Linux';
        } else if (/android/i.test(userAgent)) {
            deviceInfo.os = 'Android';
        } else if (/ios|iphone|ipad/i.test(userAgent)) {
            deviceInfo.os = 'iOS';
        }

        // Detect browser
        if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) {
            deviceInfo.browser = 'Chrome';
        } else if (/firefox/i.test(userAgent)) {
            deviceInfo.browser = 'Firefox';
        } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
            deviceInfo.browser = 'Safari';
        } else if (/edg/i.test(userAgent)) {
            deviceInfo.browser = 'Edge';
        } else if (/opera|opr/i.test(userAgent)) {
            deviceInfo.browser = 'Opera';
        }

        return deviceInfo;
    }

    /**
     * Generate a new UUID for parent log tracking
     */
    static generateId(): string {
        return uuidv4();
    }
}

export default RequestContext;

