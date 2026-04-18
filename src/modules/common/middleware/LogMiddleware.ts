import { Request, Response, NextFunction } from 'express';
import ActivityLogService from '../../ActivityLog/services/ActivityLogService';
import { ACTION_TYPES, LOG_STATUS } from '../../ActivityLog/constants/activityLogConstants';
import crypto from 'crypto';
import logger from '../services/WinstonLogger';

// Cache to track recently logged requests (to prevent duplicates)
const recentRequests = new Map<string, number>();

// Time window for deduplication (in milliseconds)
const DEDUP_WINDOW_MS = 2000; // 2 seconds

// Cleanup interval for the cache
const CLEANUP_INTERVAL_MS = 60000; // 1 minute

// Routes that already have explicit logging - skip automatic API_CALL logging
const EXCLUDED_ROUTE_PATTERNS = [
    /\/api\/.*\/auth\//,      // All auth routes (login, logout, verify-2fa, etc.)
];

// Cleanup old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of recentRequests.entries()) {
        if (now - timestamp > DEDUP_WINDOW_MS * 2) {
            recentRequests.delete(key);
        }
    }
}, CLEANUP_INTERVAL_MS);

export class LogMiddleware {
    /**
     * Check if route should be excluded from automatic logging
     */
    private static shouldExcludeRoute(url: string): boolean {
        const baseUrl = url.split('?')[0]; // Remove query params
        for (const pattern of EXCLUDED_ROUTE_PATTERNS) {
            if (pattern.test(baseUrl)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Generate a unique hash for a request based on user, method, url, and body
     */
    private static generateRequestHash(req: Request): string {
        const userId = (req as any).user?._id?.toString() || 'anonymous';
        const method = req.method;
        const url = req.originalUrl;
        const body = JSON.stringify(req.body || {});

        const data = `${userId}:${method}:${url}:${body}`;
        return crypto.createHash('md5').update(data).digest('hex');
    }

    /**
     * Check if this request was recently logged (duplicate)
     */
    private static isDuplicate(requestHash: string): boolean {
        const lastLogTime = recentRequests.get(requestHash);
        if (lastLogTime) {
            const timeSinceLastLog = Date.now() - lastLogTime;
            if (timeSinceLastLog < DEDUP_WINDOW_MS) {
                return true;
            }
        }
        return false;
    }

    /**
     * Mark this request as logged
     */
    private static markAsLogged(requestHash: string): void {
        recentRequests.set(requestHash, Date.now());
    }

    public static async logRequest(req: Request, res: Response, next: NextFunction) {
        // Skip auth routes - they have their own explicit logging
        if (LogMiddleware.shouldExcludeRoute(req.originalUrl)) {
            return next();
        }

        // Generate request hash for deduplication
        const requestHash = LogMiddleware.generateRequestHash(req);

        // Skip if this is a duplicate request
        if (LogMiddleware.isDuplicate(requestHash)) {
            return next();
        }

        // Mark as logged immediately to prevent race conditions
        LogMiddleware.markAsLogged(requestHash);

        // Capture original response methods to intercept the response
        const originalSend = res.send;

        // Track start time
        const startTime = Date.now();

        // Override response methods
        res.send = function (body: any): Response {
            // Restore original method
            res.send = originalSend;

            // Call original method
            const response = originalSend.call(this, body);

            // Log after response is sent
            LogMiddleware.logActivity(req, res, body, startTime);

            return response;
        };

        next();
    }

    private static async logActivity(req: Request, res: Response, responseBody: any, startTime: number) {
        try {
            const responseTime = Date.now() - startTime;
            const statusCode = res.statusCode;

            // Determine status
            let status = LOG_STATUS.SUCCESS;
            if (statusCode >= 400 && statusCode < 500) {
                status = LOG_STATUS.FAILED;
            } else if (statusCode >= 500) {
                status = LOG_STATUS.FAILED;
            }

            // Parse response body if it's a string
            let parsedBody = responseBody;
            if (typeof responseBody === 'string') {
                try {
                    parsedBody = JSON.parse(responseBody);
                } catch (e) {
                    // Not JSON, keep as is
                }
            }

            await ActivityLogService.logFromRequest(
                req,
                'API',
                ACTION_TYPES.API_CALL,
                {
                    status: status,
                    description: `API Call: ${req.method} ${req.originalUrl}`,
                    metadata: {
                        statusCode,
                        responseTime: `${responseTime}ms`,
                        responseBody: parsedBody
                    }
                }
            );
        } catch (error) {
            logger.error('Error in LogMiddleware', { error });
        }
    }
}
