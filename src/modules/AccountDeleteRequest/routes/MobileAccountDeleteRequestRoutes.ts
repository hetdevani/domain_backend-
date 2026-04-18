import { Router } from 'express';
import { MobileAccountDeleteRequestController } from '../controllers/MobileAccountDeleteRequestController';
import { AccountDeleteRequestValidators } from '../validators/AccountDeleteRequestValidators';
import { RouteConfig, ValidationMiddleware } from '../../common/middleware/validationMiddleware';
import AppPermissionMiddleware from '../../common/middleware/appPermissionMiddleware';

class MobileAccountDeleteRequestRoutes {
    public router: Router;
    private controller: MobileAccountDeleteRequestController;
    private routeConfigs: RouteConfig[];
    private appPermissionMiddleware: AppPermissionMiddleware;

    constructor() {
        this.router = Router();
        this.controller = new MobileAccountDeleteRequestController();
        this.appPermissionMiddleware = new AppPermissionMiddleware();
        this.routeConfigs = [
            {
                path: '/request-for-delete-account',
                method: 'post',
                middlewares: [
                    this.appPermissionMiddleware.checkAppPermission(),
                ],
                handler: this.controller.requestForDeleteAccount.bind(this.controller),
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

export default new MobileAccountDeleteRequestRoutes().router;
