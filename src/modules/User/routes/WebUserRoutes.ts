import { Router } from 'express';
import { WebUserController } from '../controllers/WebUserController';
import { RouteConfig, ValidationMiddleware } from '../../common/middleware/validationMiddleware';
import { UserValidators } from '../validators/UserValidators';
import { MODULES, PERMISSIONS_TYPE } from '../../common/constants/modules';
import PermissionMiddleware from '../../common/middleware/permissionMiddleware';

class WebUserRoutes {
    public router: Router;
    private controller: WebUserController;
    private routeConfigs: RouteConfig[];
    private permissionMiddleware: PermissionMiddleware;

    constructor() {
        this.router = Router();
        this.controller = new WebUserController();
        this.permissionMiddleware = new PermissionMiddleware(MODULES.USER);
        this.routeConfigs = [
            {
                path: '/paginate',
                method: 'post',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.LIST),
                    ValidationMiddleware.validateRequest(UserValidators.PaginateRequestSchema)
                ],
                // todo add user type in filter
                handler: this.controller.paginate.bind(this.controller),
            },
            {
                path: '/create',
                method: 'post',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.INSERT),
                    ValidationMiddleware.validateRequest(UserValidators.createUserSchema),
                    // todo email and mobile must be diffrent
                ],
                handler: this.controller.create.bind(this.controller),
            },
            {
                path: '/:id',
                method: 'get',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.VIEW),
                    ValidationMiddleware.validateRequest(UserValidators.idParamSchema, 'params'),
                ],
                handler: this.controller.getById.bind(this.controller),
            },
            {
                path: '/:id',
                method: 'put',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.UPDATE),
                    ValidationMiddleware.validateRequest(UserValidators.updateUserSchema),
                ],
                handler: this.controller.update.bind(this.controller),
            },
            {
                path: '/:id/activate',
                method: 'put',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.UPDATE),
                    ValidationMiddleware.validateRequest(UserValidators.idParamSchema, 'params'),
                ],
                handler: this.controller.activate.bind(this.controller),
            },
            {
                path: '/:id/deactivate',
                method: 'put',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.UPDATE),
                    ValidationMiddleware.validateRequest(UserValidators.idParamSchema, 'params'),
                ],
                handler: this.controller.deactivate.bind(this.controller),
            },
            {
                path: '/:id/soft-delete',
                method: 'put',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.DELETE),
                    ValidationMiddleware.validateRequest(UserValidators.idParamSchema, 'params'),
                ],
                handler: this.controller.softDelete.bind(this.controller),
            },
            {
                path: '/reset-password',
                method: 'post',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.UPDATE),
                    ValidationMiddleware.validateRequest(UserValidators.resetPasswordSchema),
                ],
                handler: this.controller.resetPassword.bind(this.controller),
            },
            {
                path: '/download-report',
                method: 'post',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.VIEW),
                    ValidationMiddleware.validateRequest(UserValidators.downloadReportSchema),
                ],
                handler: this.controller.downloadReport.bind(this.controller),
            },
            {
                path: '/list',
                method: 'post',
                middlewares: [
                    // this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.VIEW),
                    this.permissionMiddleware.checkTokenWithoutPermission(),
                    ValidationMiddleware.validateRequest(UserValidators.userListSchema),
                ],
                handler: this.controller.list.bind(this.controller),
            },
            {
                path: '/detail-view/:id',
                method: 'get',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.VIEW),
                    ValidationMiddleware.validateRequest(UserValidators.idParamSchema, 'params'),
                ],
                handler: this.controller.getDetailViewById.bind(this.controller),
            },
            {
                path: '/my-profile',
                method: 'post',
                middlewares: [
                    this.permissionMiddleware.checkTokenWithoutPermission(),
                ],
                handler: this.controller.myProfile.bind(this.controller),
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

export default new WebUserRoutes().router;
