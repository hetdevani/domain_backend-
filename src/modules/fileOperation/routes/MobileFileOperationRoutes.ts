import express, { Router } from 'express';
import { MobileFileOperationController } from '../controllers/MobileFileOperationController';
import { FileOperationValidators } from '../validators/FileOperationValidators';
import { RouteConfig, ValidationMiddleware } from '../../common/middleware/validationMiddleware';
import UploadMiddleware from '../../common/middleware/fileOperationMiddleware';
import AppPermissionMiddleware from '../../common/middleware/appPermissionMiddleware';

class MobileFileOperationRoutes {
    public router: Router;
    private controller: MobileFileOperationController;
    private routeConfigs: RouteConfig[];
    private uploadMiddleware: UploadMiddleware;
    private appPermissionMiddleware: AppPermissionMiddleware;

    constructor() {
        this.router = Router();
        this.controller = new MobileFileOperationController();
        this.uploadMiddleware = new UploadMiddleware();
        this.appPermissionMiddleware = new AppPermissionMiddleware();
        this.routeConfigs = [
            {
                path: '/upload-file',
                method: 'post',
                middlewares: [
                    // this.appPermissionMiddleware.checkAppPermission(),
                    ValidationMiddleware.validateRequest(FileOperationValidators.uploadFileOperationSchema),
                    this.uploadMiddleware.checkFilePath(),
                ],
                handler: this.controller.uploadFiles.bind(this.controller),
            },
            {
                path: '/delete-file',
                method: 'post',
                middlewares: [
                    // this.appPermissionMiddleware.checkAppPermission(),
                    ValidationMiddleware.validateRequest(FileOperationValidators.removeFileOperationSchema),
                ],
                handler: this.controller.deleteFile.bind(this.controller),
            },
            {
                path: '/signed-url',
                method: 'post',
                middlewares: [
                    // this.appPermissionMiddleware.checkAppPermission(),
                ],
                handler: this.controller.getSignedUrl.bind(this.controller),
            },

            {
                path: '/latest-apk',
                method: 'get',
                middlewares: [
                    // this.appPermissionMiddleware.checkAppPermission(),
                    // ValidationMiddleware.validateRequest(FileOperationValidators.removeFileOperationSchema),
                ],
                handler: this.controller.getLatestVersion.bind(this.controller),
            },
            {
                path: '/bucket',
                method: 'post',
                middlewares: [
                    this.appPermissionMiddleware.checkAppPermission(),
                    // ValidationMiddleware.validateRequest(FileOperationValidators.removeFileOperationSchema),
                ],
                handler: this.controller.bucketImageUpload.bind(this.controller),
            },
            {
                path: '/bucket-axis-camera/:id',
                method: 'get',
                middlewares: [
                    // this.appPermissionMiddleware.checkAppPermission(),
                    // ValidationMiddleware.validateRequest(FileOperationValidators.removeFileOperationSchema),
                ],
                handler: this.controller.bucketImageUploadAxisCameraGet.bind(this.controller),
            },
            {
                path: '/bucket-axis-camera/:id',
                method: 'post',
                middlewares: [
                    express.raw({ type: "image/*", limit: "10mb" }),
                    // this.appPermissionMiddleware.checkAppPermission(),
                    // ValidationMiddleware.validateRequest(FileOperationValidators.removeFileOperationSchema),
                ],
                handler: this.controller.bucketImageUploadAxisCamera.bind(this.controller),
            }
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

export default new MobileFileOperationRoutes().router;
