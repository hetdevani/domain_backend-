import { Router } from 'express';
import { MobileNotificationController } from '../controllers/MobileNotificationController';
import { NotificationValidators } from '../validators/NotificationValidators';
import { RouteConfig, ValidationMiddleware } from '../../common/middleware/validationMiddleware';
import AppPermissionMiddleware from '../../common/middleware/appPermissionMiddleware';

class MobileNotificationRoutes {
    public router: Router;
    private controller: MobileNotificationController;
    private routeConfigs: RouteConfig[];
    private appPermissionMiddleware: AppPermissionMiddleware;

    constructor() {
        this.router = Router();
        this.controller = new MobileNotificationController();
        this.appPermissionMiddleware = new AppPermissionMiddleware();
        this.routeConfigs = [
            {
                path: '/list',
                method: 'post',
                middlewares: [
                    this.appPermissionMiddleware.checkAppPermission(),
                    ValidationMiddleware.validateRequest(NotificationValidators.PaginateRequestSchema)
                ],
                handler: this.controller.list.bind(this.controller),
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

export default new MobileNotificationRoutes().router;
