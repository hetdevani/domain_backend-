import { Router } from 'express';
import WebMasterRoutes from './WebMasterRoutes';

class MasterRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.configureRoutes();
    }

    private configureRoutes(): void {
        this.router.use('/web/master', WebMasterRoutes);
    }
}

export const masterRoutes = new MasterRoutes().router;
