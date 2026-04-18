import { Router } from 'express';
import MobileNotificationRoutes from './MobileNotificationRoutes';
import WebNotificationRoutes from './WebNotificationRoutes';

class NotificationRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.configureRoutes();
    }

    private configureRoutes(): void {
        this.router.use('/mobile/notification', MobileNotificationRoutes);
        this.router.use('/web/notification', WebNotificationRoutes);
    }
}

export const notificationRoutes = new NotificationRoutes().router;
