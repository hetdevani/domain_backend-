import { Router } from 'express';
import { WebAccountDeleteRequestController } from '../controllers/WebAccountDeleteRequestController';
import { AccountDeleteRequestValidators } from '../validators/AccountDeleteRequestValidators';
import { RouteConfig, ValidationMiddleware } from '../../common/middleware/validationMiddleware';
import { MODULES, PERMISSIONS_TYPE } from '../../common/constants/modules';
import PermissionMiddleware from '../../common/middleware/permissionMiddleware';

class WebAccountDeleteRequestRoutes {
    public router: Router;
    private routeConfigs: RouteConfig[];
    private controller: WebAccountDeleteRequestController;
    private permissionMiddleware: PermissionMiddleware;

    constructor() {
        this.router = Router();
        this.controller = new WebAccountDeleteRequestController();
        this.permissionMiddleware = new PermissionMiddleware(MODULES.ACCOUNT_DELETE_REQUEST);

        this.routeConfigs = [
            {
                path: '/paginate',
                method: 'post',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.LIST),
                    ValidationMiddleware.validateRequest(AccountDeleteRequestValidators.PaginateRequestSchema)
                ],
                handler: this.controller.paginate.bind(this.controller),
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

export default new WebAccountDeleteRequestRoutes().router;
