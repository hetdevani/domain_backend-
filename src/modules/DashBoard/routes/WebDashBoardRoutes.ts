import { Router } from 'express';
import { WebDashBoardController } from '../controllers/WebDashBoardController';
import { DashBoardValidators } from '../validators/DashBoardValidators';
import { RouteConfig, ValidationMiddleware } from '../../common/middleware/validationMiddleware';
import { MODULES, PERMISSIONS_TYPE } from '../../common/constants/modules';
import PermissionMiddleware from '../../common/middleware/permissionMiddleware';

class WebDashBoardRoutes {
    public router: Router;
    private routeConfigs: RouteConfig[];
    private controller: WebDashBoardController;
    private permissionMiddleware: PermissionMiddleware;

    constructor() {
        this.router = Router();
        this.controller = new WebDashBoardController();
        this.permissionMiddleware = new PermissionMiddleware(MODULES.DASH_BOARD);

        this.routeConfigs = [
            // {
            //     path: '/get-total-data',
            //     method: 'post',
            //     middlewares: [
            //         this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.LIST),
            //         ValidationMiddleware.validateRequest(DashBoardValidators.dateFilter)
            //     ],
            //     handler: this.controller.getTotalData.bind(this.controller),
            // },
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

export default new WebDashBoardRoutes().router;
