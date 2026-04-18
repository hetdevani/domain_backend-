import { Router } from 'express';
import { WebSettingController } from '../controllers/WebSettingController';
import { SettingValidators } from '../validators/SettingValidators';
import { RouteConfig, ValidationMiddleware } from '../../common/middleware/validationMiddleware';
import { MODULES, PERMISSIONS_TYPE } from '../../common/constants/modules';
import PermissionMiddleware from '../../common/middleware/permissionMiddleware';

class WebSettingRoutes {
    public router: Router;
    private routeConfigs: RouteConfig[];
    private controller: WebSettingController;
    private permissionMiddleware: PermissionMiddleware;

    constructor() {
        this.router = Router();
        this.controller = new WebSettingController();
        this.permissionMiddleware = new PermissionMiddleware(MODULES.SETTING);

        this.routeConfigs = [
            {
                path: '/:type',
                method: 'get',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.VIEW),
                    ValidationMiddleware.validateRequest(SettingValidators.typeParamSchema, 'params'),
                ],
                handler: this.controller.getByType.bind(this.controller),
            },
            {
                path: '/:type',
                method: 'put',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.UPDATE),
                    ValidationMiddleware.validateRequest(SettingValidators.updateSettingSchema),
                ],
                handler: this.controller.updateByType.bind(this.controller),
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

export default new WebSettingRoutes().router;
