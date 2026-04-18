
import { Router } from 'express';
import WebAuthRoutes from './WebAuthRoutes';
import MobileAuthRoutes from './MobileAuthRoutes';


class AuthRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.configureRoutes();
    }

    private configureRoutes(): void {
        this.router.use('/mobile/auth', MobileAuthRoutes);
        this.router.use('/web/auth', WebAuthRoutes);
    }
}

export const authRoutes = new AuthRoutes().router;