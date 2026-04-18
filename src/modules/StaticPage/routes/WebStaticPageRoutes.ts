import { Router } from 'express';
import { WebStaticPageController } from '../controllers/WebStaticPageController';
import { StaticPageValidators } from '../validators/StaticPageValidators';
import { RouteConfig, ValidationMiddleware } from '../../common/middleware/validationMiddleware';
import { MODULES, PERMISSIONS_TYPE } from '../../common/constants/modules';
import PermissionMiddleware from '../../common/middleware/permissionMiddleware';

class WebStaticPageRoutes {
    public router: Router;
    private routeConfigs: RouteConfig[];
    private controller: WebStaticPageController;
    private permissionMiddleware: PermissionMiddleware;

    constructor() {
        this.router = Router();
        this.controller = new WebStaticPageController();
        this.permissionMiddleware = new PermissionMiddleware(MODULES.STATIC_PAGE);

        this.routeConfigs = [
            {
                path: '/paginate',
                method: 'post',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.LIST),
                    ValidationMiddleware.validateRequest(StaticPageValidators.PaginateRequestSchema)
                ],
                handler: this.controller.paginate.bind(this.controller),
            },
            // {
            //     path: '/create',
            //     method: 'post',
            //     middlewares: [
            //         this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.INSERT),
            //         ValidationMiddleware.validateRequest(StaticPageValidators.createStaticPageSchema),
            //     ],
            //     handler: this.controller.create.bind(this.controller),
            // },
            {
                path: '/:id',
                method: 'get',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.VIEW),
                    ValidationMiddleware.validateRequest(StaticPageValidators.idParamSchema, 'params'),
                ],
                handler: this.controller.getById.bind(this.controller),
            },
            {
                path: '/:id',
                method: 'put',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.UPDATE),
                    ValidationMiddleware.validateRequest(StaticPageValidators.updateStaticPageSchema),
                ],
                handler: this.controller.update.bind(this.controller),
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

export default new WebStaticPageRoutes().router;
