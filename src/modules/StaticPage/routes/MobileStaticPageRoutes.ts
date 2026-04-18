import { Router } from 'express';
import { MobileStaticPageController } from '../controllers/MobileStaticPageController';
import { StaticPageValidators } from '../validators/StaticPageValidators';
import { RouteConfig, ValidationMiddleware } from '../../common/middleware/validationMiddleware';
import AppPermissionMiddleware from '../../common/middleware/appPermissionMiddleware';

class MobileStaticPageRoutes {
    public router: Router;
    private controller: MobileStaticPageController;
    private routeConfigs: RouteConfig[];
    private appPermissionMiddleware: AppPermissionMiddleware;

    constructor() {
        this.router = Router();
        this.controller = new MobileStaticPageController();
        this.appPermissionMiddleware = new AppPermissionMiddleware();
        this.routeConfigs = [
            {
                path: '/:code',
                method: 'get',
                middlewares: [
                    this.appPermissionMiddleware.checkAppPermission(),
                ],
                handler: this.controller.getPage.bind(this.controller),
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

export default new MobileStaticPageRoutes().router;
