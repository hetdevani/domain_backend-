import { Router } from 'express';
import WebSettingRoutes from './WebSettingRoutes';

class SettingRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.configureRoutes();
    }

    private configureRoutes(): void {
        this.router.use('/web/setting', WebSettingRoutes);
    }
}

export const settingRoutes = new SettingRoutes().router;
