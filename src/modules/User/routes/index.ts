import { Router } from 'express';
import MobileUserRoutes from './MobileUserRoutes';
import WebUserRoutes from './WebUserRoutes';

class UserRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.configureRoutes();
    }

    private configureRoutes(): void {
        this.router.use('/mobile/user', MobileUserRoutes);
        this.router.use('/web/user', WebUserRoutes);
    }
}

export const userRoutes = new UserRoutes().router;
