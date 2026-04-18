import { Router } from 'express';
import WebRoleRoutes from './WebRoleRoutes';

class RoleRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.configureRoutes();
    }

    private configureRoutes(): void {
        this.router.use('/web/role', WebRoleRoutes);
    }
}

export const roleRoutes = new RoleRoutes().router;
