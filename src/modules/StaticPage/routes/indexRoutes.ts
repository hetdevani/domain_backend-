import { Router } from 'express';
import MobileStaticPageRoutes from './MobileStaticPageRoutes';
import WebStaticPageRoutes from './WebStaticPageRoutes';

class StaticPageRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.configureRoutes();
    }

    private configureRoutes(): void {
        this.router.use('/mobile/static-page', MobileStaticPageRoutes);
        this.router.use('/web/static-page', WebStaticPageRoutes);
    }
}

export const staticPageRoutes = new StaticPageRoutes().router;
