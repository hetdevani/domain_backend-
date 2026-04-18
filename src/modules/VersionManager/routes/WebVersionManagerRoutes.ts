import { Router } from 'express';
import { WebVersionManagerController } from '../controllers/WebVersionManagerController';
import { VersionManagerValidators } from '../validators/VersionManagerValidators';
import { RouteConfig, ValidationMiddleware } from '../../common/middleware/validationMiddleware';
import { MODULES, PERMISSIONS_TYPE } from '../../common/constants/modules';
import PermissionMiddleware from '../../common/middleware/permissionMiddleware';

class WebVersionManagerRoutes {
    public router: Router;
    private routeConfigs: RouteConfig[];
    private controller: WebVersionManagerController;
    private permissionMiddleware: PermissionMiddleware;

    constructor() {
        this.router = Router();
        this.controller = new WebVersionManagerController();
        this.permissionMiddleware = new PermissionMiddleware(MODULES.VERSIONMANAGER);

        this.routeConfigs = [
            {
                path: '/paginate',
                method: 'post',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.LIST),
                    ValidationMiddleware.validateRequest(VersionManagerValidators.PaginateRequestSchema)
                ],
                handler: this.controller.paginate.bind(this.controller),
            },
            {
                path: '/create',
                method: 'post',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.INSERT),
                    ValidationMiddleware.validateRequest(VersionManagerValidators.createVersionManagerSchema),
                ],
                handler: this.controller.create.bind(this.controller),
            },
            {
                path: '/:id',
                method: 'get',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.VIEW),
                    ValidationMiddleware.validateRequest(VersionManagerValidators.idParamSchema, 'params'),
                ],
                handler: this.controller.getById.bind(this.controller),
            },
            {
                path: '/:id',
                method: 'put',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.UPDATE),
                    ValidationMiddleware.validateRequest(VersionManagerValidators.updateVersionManagerSchema),
                ],
                handler: this.controller.update.bind(this.controller),
            },
            {
                path: '/:id/activate',
                method: 'put',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.UPDATE),
                    ValidationMiddleware.validateRequest(VersionManagerValidators.idParamSchema, 'params'),
                ],
                handler: this.controller.activateStatus.bind(this.controller),
            },
            {
                path: '/get-count',
                method: 'post',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.VIEW),
                ],
                handler: this.controller.getTicketsCount.bind(this.controller),
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

export default new WebVersionManagerRoutes().router;
