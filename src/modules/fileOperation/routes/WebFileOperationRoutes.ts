import { Router } from 'express';
import { WebFileOperationController } from '../controllers/WebFileOperationController';
import { FileOperationValidators } from '../validators/FileOperationValidators';
import { RouteConfig, ValidationMiddleware } from '../../common/middleware/validationMiddleware';
import UploadMiddleware from '../../common/middleware/fileOperationMiddleware';
import { MODULES, PERMISSIONS_TYPE } from '../../common/constants/modules';
import PermissionMiddleware from '../../common/middleware/permissionMiddleware';

class WebFileOperationRoutes {
    public router: Router;
    private routeConfigs: RouteConfig[];
    private controller: WebFileOperationController;
    // private permissionMiddleware: PermissionMiddleware;
    private uploadMiddleware: UploadMiddleware;

    constructor() {
        this.router = Router();
        this.controller = new WebFileOperationController();
        // this.permissionMiddleware = new PermissionMiddleware(MODULES.FILE_OPERATION);
        this.uploadMiddleware = new UploadMiddleware()

        this.routeConfigs = [
            {
                path: '/upload-file',
                method: 'post',
                middlewares: [
                    ValidationMiddleware.validateRequest(FileOperationValidators.uploadFileOperationSchema),
                    this.uploadMiddleware.checkFilePath(),
                ],
                handler: this.controller.uploadFiles.bind(this.controller),
            },
            {
                path: '/delete-file',
                method: 'post',
                middlewares: [
                    ValidationMiddleware.validateRequest(FileOperationValidators.removeFileOperationSchema),
                ],
                handler: this.controller.deleteFile.bind(this.controller),
            },
            {
                path: '/signed-url',
                method: 'post',
                middlewares: [
                    // ValidationMiddleware.validateRequest(FileOperationValidators.signedUrlSchema),
                ],
                handler: this.controller.getSignedUrl.bind(this.controller),
            },
            // {
            //     path: '/import-excel-db',
            //     method: 'post',
            //     middlewares: [
            //         ValidationMiddleware.validateRequest(FileOperationValidators.importExcelSchema),
            //         this.uploadMiddleware.uploadSingleExcelFiles(),
            //     ],
            //     handler: this.controller.importExcelForDb.bind(this.controller),
            // },
        ];
        this.configureRoutes();
    }

    private configureRoutes(): void {
        this.routeConfigs.forEach((routeConfig) => {
            const { method, path, middlewares, handler } = routeConfig;
            if (middlewares && middlewares.length > 0) {
                this.router[method](path, middlewares, handler);
            } else {
                this.router[method](path, handler);
            }
        });
    }
}

export default new WebFileOperationRoutes().router;