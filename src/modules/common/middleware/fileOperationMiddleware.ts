import multer from 'multer';
import AWS from 'aws-sdk';
import multerS3 from 'multer-s3';
import path from 'path';
import mimeTypes from 'mime-types';
import * as fs from 'fs';
// import fileType from 'file-type';
// import * as fileType from 'file-type';
import { NextFunction, Request, Response } from 'express';
import { PROJECT_CONFIG } from '../config/ProjectConfig';
import { ErrorResponseHandler } from '../response/errorResponse';
import CryptoUtils from '../utils/cryptoUtils';
import { VALID_FILE_TYPES, VALID_MIME_TYPES } from '../constants/common';
import { messages } from '../config/message';
import logger from '../services/WinstonLogger';

export default class UploadMiddleware {

    private storageLocal = multer.diskStorage({
        destination: (req: Request, file: any, cb: Function) => {
            let destinationPath = req.headers.destinationPath;

            cb(null, destinationPath);
        },
        filename: (req: Request, file: any, cb: Function) => {
            const module = req.headers.module as string;
            const version = req.headers.version as string;
            const originalName = file.originalname;
            if (module === 'Brand' || module === 'Coverage') {
                cb(null, originalName);

                return true;
            }
            const uniquePostfix = CryptoUtils.generateUniqueId();
            const fileExt = path.extname(originalName);
            // const timestamp = Date.now();
            // const filenameWithPostfix = `${timestamp}-${path.basename(originalName, fileExt)}-${uniquePostfix}${fileExt}`;

            let filenameWithPostfix = `${path.basename(originalName, fileExt)}-${uniquePostfix}${fileExt}`;
            if (version) {
                const uniqueNumber = Math.floor(Math.random() * 100000);
                filenameWithPostfix = `${path.basename(originalName, fileExt)}-${uniqueNumber}-${version}${fileExt}`;

            }
            cb(null, filenameWithPostfix);
        }
    });

    private s3 = new AWS.S3({
        accessKeyId: process.env.AWS_S3_BUCKET_ACCESS_KEY,
        secretAccessKey: process.env.AWS_S3_BUCKET_SECRET_ACCESS_KEY
    });

    private storageS3 = multerS3({
        s3: this.s3 as any,
        // Dynamic bucket selection based on access-type header
        bucket: (req: any, file: any, cb: Function) => {
            const accessType =
                (req.headers["access-type"] as string) ||
                PROJECT_CONFIG.S3_DEFAULT_ACCESS_TYPE;

            if (accessType === "public") {
                logger.info('s3 public++++++++++', { data: process.env.AWS_S3_BUCKET_NAME });
                cb(null, process.env.AWS_S3_BUCKET_NAME as string);
            } else {
                console.log(
                    "s3 private++++++++++",
                    process.env.AWS_PRIVATE_S3_BUCKET_NAME
                );
                cb(null, process.env.AWS_PRIVATE_S3_BUCKET_NAME as string);
            }
        },
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: (req: Request, file: any, cb: Function) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req: Request, file: any, cb: Function) => {
            const module = (req.headers.module as string) || 'assets';
            const uniquePostfix = Date.now().toString();
            const fileExt = path.extname(file.originalname);
            const filename = `${path.basename(file.originalname, fileExt)}-${uniquePostfix}${fileExt}`;

            // Get access type from header, default to private
            const accessType =
                (req.headers["access-type"] as string) ||
                PROJECT_CONFIG.S3_DEFAULT_ACCESS_TYPE;
            const folderPrefix = accessType === "public" ? "static" : "private";

            cb(null, `${folderPrefix}/${module}/${filename}`);
        }
    });

    private isValidFileTypeAndMimeType(file: Express.Multer.File): boolean {
        logger.info('file.originalname', { data: file.originalname });
        const extname = path.extname(file.originalname).toLowerCase();
        const mimeType = file.mimetype.toLowerCase();
        logger.info('isValidFileTypeAndMimeType extname', { data: extname, mimeType });
        let isValid = this.isValidContent(file);
        return VALID_FILE_TYPES.includes(extname) && VALID_MIME_TYPES.includes(mimeType) && isValid;
    }

    private isValidContent = (file: Express.Multer.File) => {
        const extname = path.extname(file.originalname).toLowerCase();
        const mimeType = mimeTypes.contentType(file.originalname);
        const fileMimeType = file.mimetype.toLowerCase();

        logger.info('isValidContent mimeType', { data: mimeType, fileMimeType });
        if (fileMimeType === 'application/octet-stream') {
            return true;
        }
        if (!mimeType) {
            logger.info('isValidContent 111111');
            return false; // Invalid or unsupported file extension
        }
        // if (fileMimeType !== mimeType) {      
        //     logger.info('fileMimeType=======>', { data: fileMimeType });
        //     logger.info('mimeType=======>', { data: mimeType });

        //     logger.info('isValidContent 222222');
        //     return false;
        // }
        return true;
    };

    // private isValidContent = async (file: Express.Multer.File) => {
    //     const extname = path.extname(file.originalname).toLowerCase();
    //     const uploadedMimeType = file.mimetype.toLowerCase();
    //     logger.info('isValidContent uploadedMimeType', { data: uploadedMimeType });
    //     if (!uploadedMimeType) {
    //         return false;
    //     }

    //     const detectedMimeType = mimeTypes.lookup(extname);
    //     logger.info('isValidContent detectedMimeType', { data: detectedMimeType });
    //     if (!detectedMimeType) {
    //         return false;
    //     }

    //     const fileBuffer = await file.buffer;
    //     const fileTypeResult = fileType.fileTypeFromBuffer(fileBuffer);

    //     if (!fileTypeResult || !fileTypeResult) {
    //         return false;
    //     }

    //     const contentBasedMimeType = fileTypeResult;

    //     return (
    //         uploadedMimeType === detectedMimeType
    //         // uploadedMimeType === contentBasedMimeType
    //     );
    // };

    private areFilenamesUnique(files: Express.Multer.File[]): boolean {
        const filenames = files.map(file => file.originalname);
        return new Set(filenames).size === filenames.length;
    }

    // private upload = multer({ storage: storageLocal }).single('file');
    private localUpload = multer({
        storage: this.storageLocal,
        limits: { fileSize: 1024 * 1024 * 50 },
        fileFilter: (req, file, cb) => {
            if (this.isValidFileTypeAndMimeType(file)) {
                cb(null, true);
                /*
                if (req.files && !this.areFilenamesUnique(req.files as Express.Multer.File[])) {
                    cb(new Error('Duplicate files detected.'));
                } else {
                    cb(null, true);
                }
                */
            } else {
                logger.info('fileFilter error');
                cb(new Error('Invalid file type or mimeType.'));
            }
        }
    }).array('file', 10);

    private localSingleUpload = multer({
        storage: this.storageLocal,
        limits: { fileSize: 1024 * 1024 * 50 },
        fileFilter: (req, file, cb) => {
            if (this.isValidFileTypeAndMimeType(file)) {
                cb(null, true);
            } else {
                cb(new Error('Invalid file type or mimeType.'));
            }
        }

    }).single('file');

    // private s3Upload = multer({ storage: storageLocal }).single('file');
    private s3Upload = multer({
        storage: this.storageS3,
        limits: { fileSize: 1024 * 1024 * 9 },
        fileFilter: (req, file, cb) => {
            if (this.isValidFileTypeAndMimeType(file)) {
                cb(null, true);
            } else {
                cb(new Error('Invalid file type or mimeType.'));
            }
        }
    }).array('file', 10);

    private async sendErrorResponse(res: Response, error: any) {
        ErrorResponseHandler.sendErrorResponse(res, error);
    }

    // private areThereDuplicateFiles(files: Express.Multer.File[]): boolean {
    //     const filenames = files.map(file => file.originalname);
    //     const uniqueFilenames = Array.from(new Set(filenames));

    //     return filenames.length !== uniqueFilenames.length;
    // }

    public checkFilePath() {
        return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
            // if (!req.files || req.files.length === 0) {
            //     return this.sendErrorResponse(res, new Error('No files attached.'));
            // }
            const version = req.headers.version as string;
            let module = 'assets';
            if (req.headers && req.headers.module) {
                module = req.headers.module as string;
                // module = module.toLowerCase();
            } else if (req.query && req.query.module) {
                module = req.query.module as string;
                // module = module.toLowerCase();
            }
            logger.info('module', { data: module });

            let destinationPath = `assets/images/${module}/`;
            if (version) {
                destinationPath = `assets/pc_client/${module}`;
            }

            if (!fs.existsSync(destinationPath)) {
                fs.mkdirSync(destinationPath, { recursive: true }); // This creates the directory recursively
            }

            logger.info('checkFilePath destinationPath', { data: destinationPath });
            req.headers.destinationPath = destinationPath;

            // if (this.areThereDuplicateFiles(req.files as Express.Multer.File[])) {
            //     return this.sendErrorResponse(res, new Error('Duplicate files detected.'));
            // }

            const useS3 = PROJECT_CONFIG.IS_UPLOAD_IN_S3;
            if (useS3) {
                this.uploadS3Middleware(req, res, next);
            } else {
                await this.uploadLocalMiddleware(req, res, next);
                logger.info('upload successfully');
            }
        };
    }

    public uploadSingleExcelFiles() {
        return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
            if (req.headers && !req.headers.module) {
                this.sendErrorResponse(res, messages.MODULE_NOT_FOUND);
            } else {
                let module = req.headers.module as string;
                // module = module.toLowerCase();

                logger.info('uploadSingleExcelFiles module', { data: module });
                // let destinationPath = `assets/data/excel/${module}/`;
                let destinationPath = `assets/data/excel/`;

                if (!fs.existsSync(destinationPath)) {
                    fs.mkdirSync(destinationPath, { recursive: true }); // This creates the directory recursively
                }

                logger.info('uploadSingleExcelFiles destinationPath', { data: destinationPath });
                req.headers.destinationPath = destinationPath;
                await this.uploadSingleLocalMiddleware(req, res, next);
            }
        };
    }

    private async uploadSingleLocalMiddleware(req: Request, res: Response, next: NextFunction) {
        this.localSingleUpload(req, res, (err: any) => {
            if (err) {
                this.sendErrorResponse(res, err);
            } else {
                next();
            }
        });
    }

    private async uploadLocalMiddleware(req: Request, res: Response, next: NextFunction) {
        this.localUpload(req, res, (err: any) => {
            // if (!req.files || req.files.length === 0) {
            //     this.sendErrorResponse(res, new Error('No files uploaded.'));
            // }
            if (err) {
                this.sendErrorResponse(res, err);
            } else {
                next();
            }
        });
    }

    private uploadS3Middleware(req: Request, res: Response, next: NextFunction) {
        this.s3Upload(req, res, (err: any) => {
            // if (!req.files || req.files.length === 0) {
            //     this.sendErrorResponse(res, new Error('No files uploaded.'));
            // }
            if (err) {
                logger.info('err S3 file', { data: err });
                this.sendErrorResponse(res, err);
            }
            next();
        });
    }
}