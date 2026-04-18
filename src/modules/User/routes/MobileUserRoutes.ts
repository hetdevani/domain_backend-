import { Router } from 'express';
import { MobileUserController } from '../controllers/MobileUserController';
import { UserValidators } from '../validators/UserValidators';
import { RouteConfig, ValidationMiddleware } from '../../common/middleware/validationMiddleware';
import AppPermissionMiddleware from '../../common/middleware/appPermissionMiddleware';
import { UserLogsValidators } from '../validators/UserLogsValidators';
class MobileUserRoutes {
    public router: Router;
    private controller: MobileUserController;
    private routeConfigs: RouteConfig[];
    private appPermissionMiddleware: AppPermissionMiddleware;

    constructor() {
        this.router = Router();
        this.controller = new MobileUserController();
        this.appPermissionMiddleware = new AppPermissionMiddleware();
        this.routeConfigs = [
            {
                path: '/update-profile',
                method: 'put',
                middlewares: [
                    this.appPermissionMiddleware.checkAppPermission(),
                    ValidationMiddleware.validateRequest(UserValidators.updateUserSchema),
                ],
                handler: this.controller.updateProfile.bind(this.controller),
            },
            {
                path: '/sync',
                method: 'post',
                middlewares: [
                    this.appPermissionMiddleware.checkAppPermission(),
                    ValidationMiddleware.validateRequest(UserValidators.syncUserSchema),
                ],
                handler: this.controller.sync.bind(this.controller),
            },
            {
                path: '/my-profile',
                method: 'get',
                middlewares: [
                    this.appPermissionMiddleware.checkAppPermission(),
                ],
                handler: this.controller.myProfile.bind(this.controller),
            },
            {
                path: '/user-location',
                method: 'post',
                middlewares: [
                    this.appPermissionMiddleware.checkAppPermission(),
                    ValidationMiddleware.validateRequest(UserLogsValidators.createUserLogsSchema)
                ],
                handler: this.controller.userLocation.bind(this.controller),
            },
            {
                path: '/notification-identifier-upsert',
                method: 'post',
                middlewares: [
                    this.appPermissionMiddleware.checkAppPermission(),
                    // ValidationMiddleware.validateRequest(UserValidators.notificationIdentifierUpsert, 'headers')
                ],
                handler: this.controller.notificationIdentifierUpsert.bind(this.controller),
            },
            {
                path: '/google-direction',
                method: 'post',
                middlewares: [
                    this.appPermissionMiddleware.checkAppPermission(),
                    ValidationMiddleware.validateRequest(UserValidators.googleDirectionSchema)
                ],
                handler: this.controller.googleDirection.bind(this.controller),
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

export default new MobileUserRoutes().router;
