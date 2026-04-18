import { Router } from 'express';
import { WebRoleController } from '../controllers/WebRoleController';
import { RouteConfig, ValidationMiddleware } from '../../common/middleware/validationMiddleware';
import { RoleValidators } from '../validators/RoleValidators'; // Import the RoleValidators class
import PermissionMiddleware from '../../common/middleware/permissionMiddleware';
import { MODULES, PERMISSIONS_TYPE } from '../../common/constants/modules';

class WebRoleRoutes {
    public router: Router;
    private controller: WebRoleController;
    private routeConfigs: RouteConfig[];
    private permissionMiddleware: PermissionMiddleware;

    constructor() {
        this.router = Router();
        this.controller = new WebRoleController();
        this.permissionMiddleware = new PermissionMiddleware(MODULES.ROLE);
        this.routeConfigs = [
            {
                path: '/paginate',
                method: 'post',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.LIST),
                    ValidationMiddleware.validateRequest(RoleValidators.PaginateRequestSchema)
                ],
                handler: this.controller.paginate.bind(this.controller),
            },
            {
                path: '/create',
                method: 'post',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.INSERT),
                    ValidationMiddleware.validateRequest(RoleValidators.createRoleSchema),
                    // Add other middleware functions here if needed
                ],
                handler: this.controller.create.bind(this.controller),
            },
            {
                path: '/:id',
                method: 'get',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.VIEW),
                    ValidationMiddleware.validateRequest(RoleValidators.idParamSchema, 'params'),
                    // Add other middleware functions here if needed
                ],
                handler: this.controller.getById.bind(this.controller),
            },
            {
                path: '/:id',
                method: 'put',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.UPDATE),
                    ValidationMiddleware.validateRequest(RoleValidators.updateRoleSchema),
                    // Add other middleware functions here if needed
                ],
                handler: this.controller.update.bind(this.controller),
            },
            {
                path: '/:id/activate',
                method: 'put',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.UPDATE),
                    ValidationMiddleware.validateRequest(RoleValidators.idParamSchema, 'params'),
                    // Add other middleware functions here if needed
                ],
                handler: this.controller.activate.bind(this.controller),
            },
            {
                path: '/:id/deactivate',
                method: 'put',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.UPDATE),
                    ValidationMiddleware.validateRequest(RoleValidators.idParamSchema, 'params'),
                    // Add other middleware functions here if needed
                ],
                handler: this.controller.deactivate.bind(this.controller),
            },
            {
                path: '/:id/soft-delete',
                method: 'put',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.DELETE),
                    // todo check message 
                    ValidationMiddleware.validateRequest(RoleValidators.idParamSchema, 'params'),
                    // Add other middleware functions here if needed
                ],
                handler: this.controller.softDelete.bind(this.controller),
            },
            {
                path: '/:id/set-default',
                method: 'put',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.UPDATE),
                    ValidationMiddleware.validateRequest(RoleValidators.idParamSchema, 'params'),
                ],
                handler: this.controller.setDefaultRole.bind(this.controller),
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

export default new WebRoleRoutes().router;
