import { Router } from 'express';
import WebActivityLogController from '../controllers/WebActivityLogController';
import { RouteConfig, ValidationMiddleware } from '../../common/middleware/validationMiddleware';
import { ActivityLogValidators } from '../validators/ActivityLogValidators';
import { MODULES, PERMISSIONS_TYPE } from '../../common/constants/modules';
import PermissionMiddleware from '../../common/middleware/permissionMiddleware';

class WebActivityLogRoutes {
    public router: Router;
    private controller: typeof WebActivityLogController;
    private routeConfigs: RouteConfig[];
    private permissionMiddleware: PermissionMiddleware;

    constructor() {
        this.router = Router();
        this.controller = WebActivityLogController;
        this.permissionMiddleware = new PermissionMiddleware(MODULES.ACTIVITY_LOG);
        this.routeConfigs = [
            {
                path: '/list',
                method: 'post',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.LIST),
                    ActivityLogValidators.list
                ],
                handler: this.controller.getActivityLogs.bind(this.controller)
            },
            {
                path: '/:id',
                method: 'get',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.VIEW),
                    ActivityLogValidators.getById
                ],
                handler: this.controller.getActivityLogById.bind(this.controller)
            },
            {
                path: '/user/:userId',
                method: 'post',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.VIEW),
                    ActivityLogValidators.getUserLogs
                ],
                handler: this.controller.getUserActivityLogs.bind(this.controller)
            },
            {
                path: '/module/:module',
                method: 'post',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.VIEW),
                    ActivityLogValidators.getModuleLogs
                ],
                handler: this.controller.getModuleActivityLogs.bind(this.controller)
            },
            {
                path: '/analytics',
                method: 'post',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.VIEW),
                    ActivityLogValidators.analytics
                ],
                handler: this.controller.getActivityAnalytics.bind(this.controller)
            },
            {
                path: '/export',
                method: 'post',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.VIEW),
                    ActivityLogValidators.export
                ],
                handler: this.controller.exportActivityLogs.bind(this.controller)
            },
            {
                path: '/search',
                method: 'post',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.VIEW),
                    ActivityLogValidators.search
                ],
                handler: this.controller.searchActivityLogs.bind(this.controller)
            },
            {
                path: '/archived',
                method: 'post',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.VIEW),
                    ActivityLogValidators.archivedLogs
                ],
                handler: this.controller.getArchivedLogs.bind(this.controller)
            },
            {
                path: '/archived/:year/:month/:day',
                method: 'post',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.VIEW),
                    ActivityLogValidators.archivedLogsByDate
                ],
                handler: this.controller.getArchivedLogsByDate.bind(this.controller)
            },
            {
                path: '/archived/search',
                method: 'post',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.VIEW),
                    ActivityLogValidators.searchArchived
                ],
                handler: this.controller.searchArchivedLogs.bind(this.controller)
            },
            {
                path: '/archived/dates',
                method: 'post',
                middlewares: [
                    this.permissionMiddleware.checkPermission(PERMISSIONS_TYPE.VIEW),
                    ActivityLogValidators.listArchiveDates
                ],
                handler: this.controller.listArchiveDates.bind(this.controller)
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

export default new WebActivityLogRoutes().router;
