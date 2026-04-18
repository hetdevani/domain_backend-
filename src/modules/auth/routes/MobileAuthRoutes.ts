import { Router } from 'express';
import { RouteConfig, ValidationMiddleware } from '../../common/middleware/validationMiddleware';
import { MobileAuthController } from '../controllers/MobileAuthController';
import { AuthValidators } from '../validators/AuthValidators';
import RateLimitMiddleware from '../../common/middleware/rateLimitMiddleware';
import AppPermissionMiddleware from '../../common/middleware/appPermissionMiddleware';

class MobileAuthRoutes {
    public router: Router;
    private controller: MobileAuthController;
    private routeConfigs: RouteConfig[];
    private rateLimitMiddleware: RateLimitMiddleware;
    private appPermissionMiddleware: AppPermissionMiddleware;

    constructor() {
        this.router = Router();
        this.controller = new MobileAuthController();
        this.rateLimitMiddleware = new RateLimitMiddleware();
        this.appPermissionMiddleware = new AppPermissionMiddleware();
        this.routeConfigs = [
            {
                path: '/validate-master-password',
                method: 'post',
                middlewares: [
                    // this.rateLimitMiddleware.ipRateLimiter(),
                    ValidationMiddleware.validateRequest(AuthValidators.validateMasterPasswordSchema),
                    // Add other middleware functions here if needed
                ],
                handler: this.controller.validateMasterPassword.bind(this.controller),
            },
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
                path: '/logout',
                method: 'post',
                middlewares: [
                    this.rateLimitMiddleware.ipRateLimiter(),
                    this.appPermissionMiddleware.checkAppPermission(),
                    // Add other middleware functions here if needed
                ],
                handler: this.controller.logout.bind(this.controller),
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
                path: '/register',
                method: 'post',
                middlewares: [
                    ValidationMiddleware.validateRequest(AuthValidators.registerCustomerSchema),
                ],
                handler: this.controller.registerCustomer.bind(this.controller),
            }
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

export default new MobileAuthRoutes().router;
