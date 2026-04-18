import { Router } from 'express';
import MobileAccountDeleteRequestRoutes from './MobileAccountDeleteRequestRoutes';
import WebAccountDeleteRequestRoutes from './WebAccountDeleteRequestRoutes';

class AccountDeleteRequestRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.configureRoutes();
    }

    private configureRoutes(): void {
        this.router.use('/mobile/account-delete-request', MobileAccountDeleteRequestRoutes);
        this.router.use('/web/account-delete-request', WebAccountDeleteRequestRoutes);
    }
}

export const accountDeleteRequestRoutes = new AccountDeleteRequestRoutes().router;
