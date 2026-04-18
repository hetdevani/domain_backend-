import { Router } from 'express';
import { userRoutes } from './modules/User/routes';
import { authRoutes } from './modules/auth/routes';
import { roleRoutes } from './modules/Role/routes';
import { masterRoutes } from './modules/Master/routes/indexRoutes';
import { fileOperationRoutes } from './modules/fileOperation/routes/indexRoutes';
import { settingRoutes } from './modules/Setting/routes/indexRoutes';
import { dashBoardRoutes } from './modules/DashBoard/routes/indexRoutes';
import { staticPageRoutes } from './modules/StaticPage/routes/indexRoutes';
import { notificationRoutes } from './modules/Notification/routes/indexRoutes';
import { accountDeleteRequestRoutes } from './modules/AccountDeleteRequest/routes/indexRoutes';
import domainRoutes from './modules/domain/routes/DomainRoutes';
import internalRoutes from './modules/internal/routes/InternalRoutes';

class RouteConfig {
    public router: Router;

    constructor() {
        this.router = Router();
        this.configureRoutes();
    }

    private configureRoutes(): void {
        // Add your route configurations here
        this.router.use('/', authRoutes);
        this.router.use('/', userRoutes);
        this.router.use('/', roleRoutes);
        this.router.use('/', masterRoutes);
        this.router.use('/', fileOperationRoutes);
        this.router.use('/', settingRoutes);
        this.router.use('/', dashBoardRoutes);
        this.router.use('/', staticPageRoutes);
        this.router.use('/', notificationRoutes);
        this.router.use('/', accountDeleteRequestRoutes);
        this.router.use('/domains', domainRoutes);
        this.router.use('/internal', internalRoutes);
    }
}

export const routeConfig = new RouteConfig().router;
