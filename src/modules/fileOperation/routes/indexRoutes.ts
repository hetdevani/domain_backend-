import { Router } from 'express';
import MobileFileOperationRoutes from './MobileFileOperationRoutes';
import WebFileOperationRoutes from './WebFileOperationRoutes';

class FileOperationRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.configureRoutes();
    }

    private configureRoutes(): void {
        this.router.use('/mobile/file-operation', MobileFileOperationRoutes);
        this.router.use('/web/file-operation', WebFileOperationRoutes);
    }
}

export const fileOperationRoutes = new FileOperationRoutes().router;