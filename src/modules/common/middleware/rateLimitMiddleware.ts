import rateLimit, { MemoryStore } from 'express-rate-limit';
import { commonMessages } from '../constants/message';
import { PROJECT_CONFIG } from '../config/ProjectConfig';
import { Request, Response } from 'express';
import { ErrorResponseHandler } from '../response/errorResponse';

export default class RateLimitMiddleware {
    // Create an IP-based rate limiter
    public ipRateLimiter() {
        return rateLimit({
            windowMs: 1000 * 60 * PROJECT_CONFIG.SET_LOGIN_REQUEST_INTERVAL, // in minutes
            max: PROJECT_CONFIG.MAX_LOGIN_REQUEST_LIMIT, // Limit each IP to max requests per `window`
            // skipFailedRequests: true, // Skip counting failed requests (4xx and 5xx status codes)
            standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
            store: new MemoryStore(),
            // keyGenerator: (req) => {
            //     // Rate limit based on the user's IP address
            //     return req.ip;
            // },
            handler: (req: Request, res: Response, options: any) => {
                let error = commonMessages.TOO_MANY_REQUEST_FROM_SAME_IP;

                ErrorResponseHandler.sendErrorResponse(res, error);
            },
        });
    }
}
