import { Router } from 'express';
import WebActivityLogRoutes from './WebActivityLogRoutes';

class ActivityLogRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.configureRoutes();
    }

    private configureRoutes(): void {
        this.router.use('/web/activity-logs', WebActivityLogRoutes);
    }
}

export const activityLogRoutes = new ActivityLogRoutes().router;

