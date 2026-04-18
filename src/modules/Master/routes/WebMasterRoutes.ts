import { Router } from 'express';
import { WebMasterController } from '../controllers/WebMasterController';
import { MasterValidators } from '../validators/MasterValidators';
import { RouteConfig, ValidationMiddleware } from '../../common/middleware/validationMiddleware';
import { MODULES, PERMISSIONS_TYPE } from '../../common/constants/modules';
import PermissionMiddleware from '../../common/middleware/permissionMiddleware';

class WebMasterRoutes {
    public router: Router;
    private routeConfigs: RouteConfig[];
    private controller: WebMasterController;
    private permissionMiddleware: PermissionMiddleware;

    constructor() {
        this.router = Router();
        this.controller = new WebMasterController();
        this.permissionMiddleware = new PermissionMiddleware(MODULES.MASTER);

        this.routeConfigs = [
            {
                path: '/paginate',
                method: 'post',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.LIST),
                    ValidationMiddleware.validateRequest(MasterValidators.PaginateRequestSchema)
                ],
                handler: this.controller.paginate.bind(this.controller),
            },
            {
                path: '/create',
                method: 'post',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.INSERT),
                    ValidationMiddleware.validateRequest(MasterValidators.createMasterSchema),
                ],
                handler: this.controller.create.bind(this.controller),
            },
            {
                path: '/:id',
                method: 'get',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.VIEW),
                    ValidationMiddleware.validateRequest(MasterValidators.idParamSchema, 'params'),
                ],
                handler: this.controller.getById.bind(this.controller),
            },
            {
                path: '/:id',
                method: 'put',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.UPDATE),
                    ValidationMiddleware.validateRequest(MasterValidators.updateMasterSchema),
                ],
                handler: this.controller.update.bind(this.controller),
            },
            {
                path: '/:id/activate',
                method: 'put',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.UPDATE),
                    ValidationMiddleware.validateRequest(MasterValidators.idParamSchema, 'params'),
                ],
                handler: this.controller.activate.bind(this.controller),
            },
            {
                path: '/:id/deactivate',
                method: 'put',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.UPDATE),
                    ValidationMiddleware.validateRequest(MasterValidators.idParamSchema, 'params'),
                ],
                handler: this.controller.deactivate.bind(this.controller),
            },
            {
                path: '/:id/soft-delete',
                method: 'put',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.DELETE),
                    ValidationMiddleware.validateRequest(MasterValidators.idParamSchema, 'params'),
                ],
                handler: this.controller.softDelete.bind(this.controller),
            },
            {
                path: '/:id/set-default',
                method: 'put',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.UPDATE),
                    ValidationMiddleware.validateRequest(MasterValidators.idParamSchema, 'params'),
                ],
                handler: this.controller.setDefaultMaster.bind(this.controller),
            },
            {
                path: '/list',
                method: 'post',
                middlewares: [
                    // this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.LIST),
                    this.permissionMiddleware.checkTokenWithoutPermission(),
                    ValidationMiddleware.validateRequest(MasterValidators.PaginateRequestSchema),
                ],
                handler: this.controller.findByFilter.bind(this.controller),
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

export default new WebMasterRoutes().router;
