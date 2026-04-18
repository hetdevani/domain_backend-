import { Router } from 'express';
import { RouteConfig, ValidationMiddleware } from '../../common/middleware/validationMiddleware';
import { WebAuthController } from '../controllers/WebAuthController';
import { AuthValidators } from '../validators/AuthValidators';
import RateLimitMiddleware from '../../common/middleware/rateLimitMiddleware';
import { MODULES } from '../../common/constants/modules';
import PermissionMiddleware from '../../common/middleware/permissionMiddleware';

class WebAuthRoutes {
    public router: Router;
    private controller: WebAuthController;
    private routeConfigs: RouteConfig[];
    private rateLimitMiddleware: RateLimitMiddleware;
    private permissionMiddleware: PermissionMiddleware;

    constructor() {
        this.router = Router();
        this.controller = new WebAuthController();
        this.rateLimitMiddleware = new RateLimitMiddleware();
        this.permissionMiddleware = new PermissionMiddleware(MODULES.USER);

        this.routeConfigs = [
            {
                path: '/login',
                method: 'post',
                middlewares: [
                    this.rateLimitMiddleware.ipRateLimiter(),
                    ValidationMiddleware.validateRequest(AuthValidators.loginViaUsernameAndPasswordSchema),
                    // Add other middleware functions here if needed
                ],
                handler: this.controller.login.bind(this.controller),
            },
            {
                path: '/authenticate-registered-user',
                method: 'post',
                middlewares: [
                    this.rateLimitMiddleware.ipRateLimiter(),
                    ValidationMiddleware.validateRequest(AuthValidators.authenticateRegisteredUserSchema),
                    // Add other middleware functions here if needed
                ],
                handler: this.controller.authenticateRegistered.bind(this.controller),
            },
            {
                path: '/authenticate-otp-verification',
                method: 'post',
                middlewares: [
                    this.rateLimitMiddleware.ipRateLimiter(),
                    ValidationMiddleware.validateRequest(AuthValidators.authenticateOtpVerificationSchema),
                    // Add other middleware functions here if needed
                ],
                handler: this.controller.authenticateOtpVerification.bind(this.controller),
            },
            {
                path: '/authenticate-reset',
                method: 'post',
                middlewares: [
                    this.rateLimitMiddleware.ipRateLimiter(),
                    ValidationMiddleware.validateRequest(AuthValidators.sendOtpToUserSchema),
                    // Add other middleware functions here if needed
                ],
                handler: this.controller.authenticateReset.bind(this.controller),
            },
            {
                path: '/forgot-password',
                method: 'post',
                middlewares: [
                    this.rateLimitMiddleware.ipRateLimiter(),
                    ValidationMiddleware.validateRequest(AuthValidators.forgotPasswordSchema),
                    // Add other middleware functions here if needed
                ],
                handler: this.controller.forgotPassword.bind(this.controller),
            },
            {
                path: '/verify-otp',
                method: 'post',
                middlewares: [
                    ValidationMiddleware.validateRequest(AuthValidators.verifyOTPdSchema),
                    // Add other middleware functions here if needed
                ],
                handler: this.controller.verifyOtp.bind(this.controller),
            },
            {
                path: '/reset-password',
                method: 'post',
                middlewares: [
                    ValidationMiddleware.validateRequest(AuthValidators.resetPasswordSchema),
                    // Add other middleware functions here if needed
                ],
                handler: this.controller.resetPassword.bind(this.controller),
            },
            {
                path: '/send-otp',
                method: 'post',
                middlewares: [
                    ValidationMiddleware.validateRequest(AuthValidators.sendOtpToUserSchema),
                    // Add other middleware functions here if needed
                ],
                handler: this.controller.sendOTP.bind(this.controller),
            },
            {
                path: '/login-with-otp',
                method: 'post',
                middlewares: [
                    ValidationMiddleware.validateRequest(AuthValidators.loginViaOTPSchema),
                    // Add other middleware functions here if needed
                ],
                handler: this.controller.loginWithOTP.bind(this.controller),
            },
            {
                path: '/logout',
                method: 'post',
                middlewares: [
                    this.rateLimitMiddleware.ipRateLimiter(),
                    this.permissionMiddleware.checkTokenWithoutPermission(),
                    // Add other middleware functions here if needed
                ],
                handler: this.controller.logout.bind(this.controller),
            },
            {
                path: '/refresh',
                method: 'post',
                middlewares: [
                    this.rateLimitMiddleware.ipRateLimiter(),
                ],
                handler: this.controller.refreshToken.bind(this.controller),
            },
            {
                path: '/sessions',
                method: 'get',
                middlewares: [
                    this.permissionMiddleware.checkTokenWithoutPermission(),
                ],
                handler: this.controller.listSessions.bind(this.controller),
            },
            {
                path: '/sessions/revoke',
                method: 'post',
                middlewares: [
                    this.permissionMiddleware.checkTokenWithoutPermission(),
                ],
                handler: this.controller.revokeSession.bind(this.controller),
            },
            {
                path: '/sessions/revoke-all',
                method: 'post',
                middlewares: [
                    this.permissionMiddleware.checkTokenWithoutPermission(),
                ],
                handler: this.controller.revokeAllSessions.bind(this.controller),
            },
        ];
        this.configureRoutes();
    }

    private configureRoutes(): void {
        this.routeConfigs.forEach((routeConfig) => {
            const { method, path, middlewares, handler } = routeConfig;
            if (middlewares && middlewares.length > 0) {
                this.router[method](path, middlewares, handler);
            } else {
                this.router[method](path, handler);
            }
        });
    }
}

export default new WebAuthRoutes().router;
