import { Router } from 'express';
import { WebNotificationController } from '../controllers/WebNotificationController';
import { NotificationValidators } from '../validators/NotificationValidators';
import { RouteConfig, ValidationMiddleware } from '../../common/middleware/validationMiddleware';
import { MODULES, PERMISSIONS_TYPE } from '../../common/constants/modules';
import PermissionMiddleware from '../../common/middleware/permissionMiddleware';

class WebNotificationRoutes {
    public router: Router;
    private routeConfigs: RouteConfig[];
    private controller: WebNotificationController;
    private permissionMiddleware: PermissionMiddleware;

    constructor() {
        this.router = Router();
        this.controller = new WebNotificationController();
        this.permissionMiddleware = new PermissionMiddleware(MODULES.NOTIFICATION);

        this.routeConfigs = [
            {
                path: '/paginate',
                method: 'post',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.LIST),
                    ValidationMiddleware.validateRequest(NotificationValidators.PaginateRequestSchema)
                ],
                handler: this.controller.paginate.bind(this.controller),
            },
            {
                path: '/read/:id',
                method: 'put',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.UPDATE)
                ],
                handler: this.controller.read.bind(this.controller),
            },
            {
                path: '/read-all',
                method: 'put',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.UPDATE)
                ],
                handler: this.controller.readAll.bind(this.controller),
            },
            {
                path: '/unread-count',
                method: 'get',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.LIST)
                ],
                handler: this.controller.unReadCount.bind(this.controller),
            },
            {
                path: '/get-all-count',
                method: 'post',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.LIST)
                ],
                handler: this.controller.getCount.bind(this.controller),
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

export default new WebNotificationRoutes().router;
