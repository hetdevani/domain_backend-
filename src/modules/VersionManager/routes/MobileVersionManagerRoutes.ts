import { Router } from 'express';
import { MobileVersionManagerController } from '../controllers/MobileVersionManagerController';
import { VersionManagerValidators } from '../validators/VersionManagerValidators';
import { RouteConfig, ValidationMiddleware } from '../../common/middleware/validationMiddleware';
import AppPermissionMiddleware from '../../common/middleware/appPermissionMiddleware';

class MobileVersionManagerRoutes {
    public router: Router;
    private controller: MobileVersionManagerController;
    private routeConfigs: RouteConfig[];
    private appPermissionMiddleware: AppPermissionMiddleware;

    constructor() {
        this.router = Router();
        this.controller = new MobileVersionManagerController();
        this.appPermissionMiddleware = new AppPermissionMiddleware();
        this.routeConfigs = [
            {
                path: '/exe',
                method: 'get',
                middlewares: [
                    this.appPermissionMiddleware.checkAppPermission(),
                ],
                handler: this.controller.getActiveVersionAPK.bind(this.controller),
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

export default new MobileVersionManagerRoutes().router;
