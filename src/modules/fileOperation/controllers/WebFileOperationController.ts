
import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { ErrorResponseHandler } from "../../common/response/errorResponse";
import { SuccessResponseHandler } from "../../common/response/successResponse";
import { messages } from "../message";
import { PROJECT_CONFIG } from '../../common/config/ProjectConfig';
import { FileOperationService } from '../services/FileOperationService';
import ExcelService from '../../common/services/ExcelService';
import logger from '../../common/services/WinstonLogger';


export class WebFileOperationController {
    private service: FileOperationService;

    constructor() {
        this.service = new FileOperationService();
    }

    public async uploadFiles(req: Request, res: Response) {
        try {
            // logger.info('re.body', { data: req, JSON.stringify(req.body) });
            logger.info('req.headers', { data: req.headers });

            const useS3 = PROJECT_CONFIG.IS_UPLOAD_IN_S3;
            const fileData = await this.service.processUploadedFile(req, useS3);

            return SuccessResponseHandler.sendSuccessResponse(res, messages.IMAGE_UPLOAD, fileData);
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async deleteFile(req: Request, res: Response) {
        try {
            const filename = req.body.fileName;
            await this.service.deleteFile(filename);
            return SuccessResponseHandler.sendSuccessResponse(res, messages.FILE_DELETED_SUCCESSFULLY, {});
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async importExcel(req: Request, res: Response) {
        try {
            const excelUploadPath = 'assets/data/excel/';
            logger.info('path.join excelUploadPath', { data: path.join(excelUploadPath) });

            /*
            const uploadedFile = await this.service.storeFile(req, res);
            const result = await ExcelService.excelToJson(path.join(__dirname, excelUploadPath, uploadedFile));
            */

            const uploadedFiles = await this.service.storeFile(req, res);
            const result = [];

            logger.info('uploadedFiles', { data: uploadedFiles });
            for (const uploadedFile of uploadedFiles) {
                const excelPath = path.join(__dirname, excelUploadPath, uploadedFile);
                const rows = await ExcelService.excelToJson(excelPath);
                result.push({ file: uploadedFile, rows: rows });
            }

            return SuccessResponseHandler.sendSuccessResponse(res, messages.OK, result);
        } catch (error: any) {
            logger.info('importExcel error', { data: error });
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }
    /*
    public async importExcelForDb(req: Request, res: Response) {
        try {
            const excelUploadPath = 'assets/data/excel/';
            const uploadedFile = req.file as Express.Multer.File;

            const excelPath = path.join(excelUploadPath, uploadedFile.filename);

            const excelData = await this.service.readExcelFile(excelPath, req.headers.module as string);

            if (uploadedFile) {
                // todo check file size
                // if (FileService.getFileSize(excelPath) > 0) {
                await fs.unlinkSync(excelPath);
                // }
            }
            const module = req.headers.module as string;
            await this.service.storeExcelData(module, excelData);

            return SuccessResponseHandler.sendSuccessResponse(res, messages.OK, {});
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }
    */
    public async getSignedUrl(req: Request, res: Response) {
        try {
            const { fileKey } = req.body;
            if (!fileKey) {
                return ErrorResponseHandler.sendErrorResponse(res, {
                    code: 'BAD_REQUEST',
                    message: 'fileKey is required',
                    status: 400
                });
            }

            const { S3ConnectionService } = await import('../../common/services/s3ConnectionService');
            const signedUrl = await S3ConnectionService.generateSignedUrl(fileKey);

            return SuccessResponseHandler.sendSuccessResponse(res, messages.OK, { signedUrl });
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }
}
