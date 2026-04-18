import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import _ from 'lodash';
import mongoose from 'mongoose';
import { ErrorResponseHandler } from '../../common/response/errorResponse';
import { messages } from '../message';
import { SeriesConfig } from '../../common/config/SeriesConfig';
import Container from '../../common/services/Container';
import FileOperationExcelService from './FileOperationExcelService';
import { PROJECT_CONFIG } from '../../common/config/ProjectConfig';
import AWS from 'aws-sdk';
import { S3ConnectionService } from '../../common/services/s3ConnectionService';
import logger from '../../common/services/WinstonLogger';

export class FileOperationService {
    private seriesGeneratorService;

    constructor() {
        this.seriesGeneratorService = Container.get('SeriesGeneratorService');
    }

    public async processUploadedFile(req: Request, useS3: boolean) {
        logger.info('processUploadedFile');
        const version = req.headers.version as string;
        const accessType = (req.headers['access-type'] as string) || PROJECT_CONFIG.S3_DEFAULT_ACCESS_TYPE;

        if (!req.files) {
            throw messages.FILE_NOT_UPLOAD;;
        }

        let reqFiles = req.files as any;
        let moduleName = req.headers.module || 'assets';

        const fileDataArray = await Promise.all(reqFiles.map(async (file: any) => {
            if (useS3) {
                file.absolutePath = await S3ConnectionService.getUrlByAccessType(file.key, accessType as 'private' | 'public');
                file.accessType = accessType;
                file.s3Key = file.key; // Store the S3 key for future reference
            } else if (version) {
                file.absolutePath = `/base/${moduleName}/${file.filename}`;
            } else {
                file.absolutePath = `/images/${moduleName}/${file.filename}`;
            }

            return file;
        }));

        logger.info('fileDataArray', { data: fileDataArray });
        return fileDataArray;
    }

    public async storeFile(req: Request, res: Response): Promise<string> {
        if (!req.files) {
            throw messages.FILE_NOT_UPLOAD;;
        }
        logger.info('storeFile req.files', { data: req.files });

        let reqFiles = req.files as any;
        const links = reqFiles.map((file: any) => path.basename(file.path));

        logger.info('links', { data: links });
        return links;
    }

    /* public async storeFile(req: any, option: any): Promise<{ link: string }> {
        return new Promise((resolve, reject) => {
            req.file('file')
                .upload({
                    dirname: option.storePath,
                    maxBytes: option.limit || 1024 * 1024 * 9
                },
                    (err: any, files: any[]) => {
                        if (err) {
                            return reject({ err: err, message: 'ERROR.' });
                        } else if (files && files.length) {
                            let link = path.basename(files[0].fd);
                            return resolve({ link: link });
                        }
                        return reject({ err: '', message: 'Please select an Excel file.' });
                    });
        });
    } */

    public async readExcelFile(filePath: string, module: string): Promise<any[]> {
        let header: string[] = this.generateExcelHeader(module);

        const excelData = await FileOperationExcelService.readAndValidateExcelHeaderData(filePath, header);

        return excelData;
    }

    private generateExcelHeader(module: string): string[] {
        const modelSchema: any = this.getModelSchema(module);
        if (!modelSchema) {
            let error = messages.MODEL_NOT_FOUND;
            error.message.replace('$moduleName', module);

            throw error;
        }

        let header: string[] = [];

        for (const path in modelSchema.paths) {
            if (path === '__v') {
                continue;
            }

            const schemaType = modelSchema.paths[path];
            if (schemaType.options && schemaType.options.required) {
                logger.info('generateExcelHeader path', { data: path });
                // todo header name
                // header.push(path.toUpperCase());
                header.push(path);
            }
        }

        return header;
    }
    /*
        public async getExcelData(module: string, data: any[]): Promise<any> {
            const modelSchema = await this.getModelSchema(module);
    
            if (!modelSchema) {
                let error = messages.MODEL_NOT_FOUND;
                error.message.replace('$moduleName', module);
    
                throw error;
            }
            if (!this.seriesGeneratorService) {
                this.seriesGeneratorService = Container.get('SeriesGeneratorService');
            }
    
            let seriesData: any = {};
            let seriesTotalEntry = 0;
            let seriesConfigs = SeriesConfig[module];
            if (seriesConfigs) {
                for (let seriesConfig of seriesConfigs) {
                    let type = SeriesConfig.seriesType;
                    let filter = SeriesConfig.filter;
    
                    seriesData = await this.seriesGeneratorService.findOneWithFilter(type, filter);
                    seriesTotalEntry = seriesData.totalEntry;
                }
            }
    
            const validationResult = await FileOperationExcelService.validateExcelData(data, modelSchema, module, seriesData);
    
            if (validationResult.errors.length > 0) {
                let errors = {
                    error: validationResult.errors
                };
                throw errors;
            }
    
            let resData = {
                data: validationResult.responseData,
                seriesData: seriesData,
                seriesTotalEntry: seriesTotalEntry
            }
    
            return resData;
        }
    
        public async storeExcelData(module: string, data: any[]): Promise<any[]> {
            // logger.info('storeExcelData resData');
            // console.log(data);
            // logger.info('storeExcelData resData');
            let resData = await this.getExcelData(module, data);
            let seriesData = resData.seriesData;
    
            const storedData = await this.storeDataInDatabase(module, resData.data);
    
            if (!storedData || !storedData.length) {
                let error = messages.DATA_NOT_INSERT;
                error.message.replace('$moduleName', module);
                logger.info('error SM', { data: error });
    
                throw error;
            }
    
            let seriesTotalEntry = 0;
            if (SeriesConfig[module] && seriesData && seriesData._id) {
                let type = SeriesConfig[module].seriesType;
                let filter = SeriesConfig[module].filter;
                seriesTotalEntry += resData.seriesTotalEntry;
    
                await this.seriesGeneratorService.updatedSeriesByTotalEntry(type, filter, seriesTotalEntry);
            }
    
            return storedData;
        }
    */
    private async storeDataInDatabase(module: string, data: any[]): Promise<any[]> {
        logger.info('storeDataInDatabase data', { data: data });
        const model = mongoose.model(module);

        // let storedData: any[] = [];
        let storedData = await model.insertMany(data);

        return storedData;
    }

    public getFileSize(filePath: string): number {
        const stats = fs.statSync(filePath);
        const fileSizeInBytes = stats.size;
        return fileSizeInBytes / 1000000.0; // convert into MB
    }

    private async getModelSchema(module: string): Promise<any> {
        const model = mongoose.models[module];

        const modelSchema = model.schema;
        return modelSchema;
    }

    public async deleteFile(filename: string) {
        if (PROJECT_CONFIG.IS_UPLOAD_IN_S3) {
            // S3 deletion logic
            const s3 = new AWS.S3({
                accessKeyId: process.env.AWS_S3_BUCKET_ACCESS_KEY,
                secretAccessKey: process.env.AWS_S3_BUCKET_SECRET_ACCESS_KEY
            });

            const params = {
                Bucket: process.env.AWS_S3_BUCKET_NAME as string,
                Key: filename
            };

            await s3.deleteObject(params).promise();
        } else {
            // Local filesystem deletion
            const excelUploadPath = 'assets';
            const filePath = path.join(excelUploadPath, filename);

            if (fs.existsSync(filePath)) {
                await fs.unlinkSync(filePath);
            }
        }
    }

    public extractDateComponentsFromFilename(dateTime: any) {
        const regex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/;
        const match = dateTime.match(regex);

        if (match) {
            const [_, year, month, day, hour, minute, second] = match;

            return {
                year: year,
                month: month,
                date: day,
                hours: hour,
                minutes: minute,
                seconds: second,
            };
        } else {
            const currentDate = new Date();

            return {
                year: currentDate.getUTCFullYear(),
                month: (currentDate.getUTCMonth() + 1).toString().padStart(2, '0'),
                date: currentDate.getUTCDate().toString().padStart(2, '0'),
                hours: currentDate.getUTCHours().toString().padStart(2, '0'),
                minutes: currentDate.getUTCMinutes().toString().padStart(2, '0'),
                seconds: currentDate.getUTCSeconds().toString().padStart(2, '0'),
            };
        }
    }
}