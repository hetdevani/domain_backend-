import { Router } from 'express';
import MobileVersionManagerRoutes from './MobileVersionManagerRoutes';
import WebVersionManagerRoutes from './WebVersionManagerRoutes';

class VersionManagerRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.configureRoutes();
    }

    private configureRoutes(): void {
        this.router.use('/mobile/version-manager', MobileVersionManagerRoutes);
        this.router.use('/web/version-manager', WebVersionManagerRoutes);
    }
}

export const versionManagerRoutes = new VersionManagerRoutes().router;
