import { Router } from 'express';
import WebDashBoardRoutes from './WebDashBoardRoutes';

class DashBoardRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.configureRoutes();
    }

    private configureRoutes(): void {
        this.router.use('/web/dashboard', WebDashBoardRoutes);
    }
}

export const dashBoardRoutes = new DashBoardRoutes().router;
