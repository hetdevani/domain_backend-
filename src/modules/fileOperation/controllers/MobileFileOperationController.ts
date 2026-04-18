import { Request, Response } from 'express';
import { messages } from '../message';
import { SuccessResponseHandler } from '../../common/response/successResponse';
import { ErrorResponseHandler } from '../../common/response/errorResponse';
import { PROJECT_CONFIG } from '../../common/config/ProjectConfig';
import { FileOperationService } from '../services/FileOperationService';
import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client, PutObjectCommand, ListObjectsV2Command, ListObjectsV2Output } from "@aws-sdk/client-s3";
import path from "path";
import { MomentUtils } from '../../common/utils/momentUtils';
import fs from 'fs';
import { S3 } from 'aws-sdk';
import { Types } from 'mongoose';
import sharp from 'sharp';
import logger from '../../common/services/WinstonLogger';

export class MobileFileOperationController {
    private service: FileOperationService;

    constructor() {
        this.service = new FileOperationService();
    }

    public async uploadFiles(req: Request, res: Response) {
        try {
            const useS3 = PROJECT_CONFIG.IS_UPLOAD_IN_S3;
            const fileData = await this.service.processUploadedFile(req, useS3);
            logger.info('fileData', { data: fileData });

            return SuccessResponseHandler.sendSuccessResponse(res, messages.OK, fileData);
        } catch (error: any) {
            if (!res.headersSent) {
                return ErrorResponseHandler.sendErrorResponse(res, error);
            }
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

    public async getLatestVersion(req: Request, res: Response) {
        try {
            const latestVersion =
            {
                "version": "1.0.2",
                "url": "/images/exe/Base PC Client 1.0.2.exe"
            };

            return SuccessResponseHandler.sendSuccessResponse(res, messages.OK, latestVersion);
        } catch (error: any) {
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    // public async bucketImageUpload(req: Request, res: Response) {
    //     try {
    //         // Extract folder and sub-folder names from headers
    //         const folderName = req.headers["module"] as string;
    //         const subFolderName = req.headers["sub-folder"] as string;
    //         const isMultiple = req.headers["upload-type"] === "multiple";

    //         if (!folderName || !subFolderName) {
    //             return ErrorResponseHandler.sendErrorResponse(res, {
    //                 code: 'NOT_FOUND',
    //                 message: 'Module name and sub-folder name are required in headers',
    //                 status: 400
    //             });
    //         }

    //         const screenData = await ScreenService.findOne({ _id: folderName });

    //         // Check if current time is within screenshot operation hours
    //         const currentTime = new Date().toISOString();
    //         if (!screenData) {
    //             return ErrorResponseHandler.sendErrorResponse(res, {
    //                 code: 'NOT_FOUND',
    //                 message: 'Screen data not found',
    //                 status: 404
    //             });
    //         }
    //         // const operationStart = screenData.screenshotOperationHoursFrom ? screenData.screenshotOperationHoursFrom : "2025-03-27T03:30:00.000Z";
    //         // const operationEnd = screenData.screenshotOperationHoursTo ? screenData.screenshotOperationHoursTo : "2025-03-27T15:30:00.000Z";

    //         // if (!operationStart || !operationEnd) {
    //         //     return SuccessResponseHandler.sendSuccessResponse(res, { code: "OK", message: 'Operation hours are not properly defined', status: 200 });
    //         // }

    //         // const operationStartDate = new Date(operationStart).toLocaleString("en-US", { timeZone: "UTC" });
    //         // const operationEndDate = new Date(operationEnd).toLocaleString("en-US", { timeZone: "UTC" });
    //         // const currentDateTime = new Date(currentTime).toLocaleString("en-US", { timeZone: "UTC" });

    //         // const operationStartTime = new Date(operationStartDate).getHours() * 60 + new Date(operationStartDate).getMinutes();
    //         // const operationEndTime = new Date(operationEndDate).getHours() * 60 + new Date(operationEndDate).getMinutes();
    //         // const currentTimeMinutes = new Date(currentDateTime).getHours() * 60 + new Date(currentDateTime).getMinutes();

    //         // const isAfterStart = currentTimeMinutes >= operationStartTime;
    //         // const isBeforeEnd = currentTimeMinutes <= operationEndTime;

    //         // if (!isAfterStart || !isBeforeEnd) {
    //         //     return SuccessResponseHandler.sendSuccessResponse(res, { code: "OK", message: `Current time (${new Date(currentTime).toLocaleString("en-US", { timeZone: "UTC" })}) is outside the allowed screenshot operation hours (${new Date(operationStart).toLocaleString("en-US", { timeZone: "UTC" })} to ${new Date(operationEnd).toLocaleString("en-US", { timeZone: "UTC" })})`, status: 200 });
    //         // }

    //         // Initialize S3 Client
    //         const s3 = new S3Client({
    //             region: process.env.AWS_REGION,
    //             credentials: {
    //                 accessKeyId: process.env.AWS_S3_BUCKET_ACCESS_KEY!,
    //                 secretAccessKey: process.env.AWS_S3_BUCKET_SECRET_ACCESS_KEY!,
    //             },
    //         });

    //         // Ensure folder structure exists
    //         async function ensureFolderExists(folderPath: string) {
    //             const listParams = { Bucket: process.env.AWS_S3_BUCKET_NAME, Prefix: folderPath, MaxKeys: 1 };
    //             const folderExists = await s3.send(new ListObjectsV2Command(listParams));

    //             if (!folderExists.Contents || folderExists.Contents.length === 0) {
    //                 logger.info('Creating folder: ${folderPath}');
    //                 const createFolderParams = {
    //                     Bucket: process.env.AWS_S3_BUCKET_NAME,
    //                     Key: `${folderPath}/`, // S3 treats this as a folder
    //                     Body: "",
    //                 };
    //                 await s3.send(new PutObjectCommand(createFolderParams));
    //             }
    //         }

    //         const selectedDate = new Date().toISOString();
    //         const newdate = new Date(selectedDate);

    //         // No timezone adjustment needed here
    //         const year = newdate.getUTCFullYear();
    //         const month = (newdate.getUTCMonth() + 1).toString().padStart(2, '0');
    //         const date = newdate.getUTCDate().toString().padStart(2, '0');
    //         const hours = newdate.getUTCHours().toString().padStart(2, '0');

    //         await ensureFolderExists(folderName);
    //         await ensureFolderExists(`${folderName}/${subFolderName}`);
    //         await ensureFolderExists(`${folderName}/${subFolderName}/${year}`);
    //         await ensureFolderExists(`${folderName}/${subFolderName}/${year}/${month}`);
    //         await ensureFolderExists(`${folderName}/${subFolderName}/${year}/${month}/${date}`);
    //         await ensureFolderExists(`${folderName}/${subFolderName}/${year}/${month}/${date}/${hours}`);

    //         // Configure Multer-S3 Storage
    //         const s3Storage = multerS3({
    //             s3: s3,
    //             bucket: process.env.AWS_S3_BUCKET_NAME as string,
    //             metadata: (req, file, cb) => {
    //                 cb(null, { fieldName: file.fieldname });
    //             },
    //             key: (req, file, cb) => {
    //                 const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    //                 const fileExt = path.extname(file.originalname);
    //                 const filename = `${path.basename(file.originalname, fileExt)}-${uniqueSuffix}${fileExt}`;
    //                 cb(null, `${folderName}/${subFolderName}/${year}/${month}/${date}/${hours}/${filename}`); // Store in correct sub-folder
    //             },
    //         });
    //         const now = new Date();
    //         const hour = now.getHours();
    //         const dateStr = now.toISOString().split('T')[0];
    //         const isoTimestamp = now.toISOString().replace(/:/g, '-').replace(/\.\d+Z$/, '');
    //         // Configure Local Storage
    //         const localStorage = multer.diskStorage({
    //             destination: (req, file, cb) => {
    //                 const localFolderPath = path.join(__dirname, '../../../../assets/images', dateStr, screenData.userId.toString(), screenData._id.toString(), subFolderName);
    //                 require('fs').mkdirSync(localFolderPath, { recursive: true });
    //                 cb(null, localFolderPath);
    //             },
    //             filename: (req, file, cb) => {
    //                 // const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    //                 const fileExt = path.extname(file.originalname);
    //                 // const filename = `${path.basename(file.originalname, fileExt)}-${uniqueSuffix}${fileExt}`;
    //                 const now = new Date();

    //                 const hour = now.getHours().toString().padStart(2, '0'); // e.g., "09", "14"
    //                 const isoTimestamp = now.toISOString()
    //                     .replace(/:/g, '-')        // Replace `:` with `-`
    //                     .replace(/\.\d+Z$/, '');   // Remove milliseconds and Z
    //                 const filename = `${hour}-${isoTimestamp}-${subFolderName}-${fileExt}`;
    //                 cb(null, filename);
    //             },
    //         });

    //         // Multer Upload Middlewares
    //         const uploadLocal = multer({ storage: localStorage });
    //         const uploadS3 = multer({ storage: s3Storage });

    //         const localUploadHandler = isMultiple ? uploadLocal.array("files", 10) : uploadLocal.single("file");
    //         const s3UploadHandler = isMultiple ? uploadS3.array("files", 10) : uploadS3.single("file");

    //         let dataToCreate: any = [];

    //         // Handle Local Upload
    //         localUploadHandler(req, res, async (localErr: any) => {
    //             if (localErr) {
    //                 return ErrorResponseHandler.sendErrorResponse(res, {
    //                     code: 'NO_FILES_UPLOADED',
    //                     message: 'File upload failed',
    //                     status: 400
    //                 });
    //             }

    //             if (isMultiple) {
    //                 const files = req.files as Express.Multer.File[] | undefined;
    //                 if (!files || files.length === 0) {
    //                     return ErrorResponseHandler.sendErrorResponse(res, {
    //                         code: 'NO_FILES_UPLOADED',
    //                         message: 'No files uploaded',
    //                         status: 400
    //                     });
    //                 }
    //                 // const validFiles = files.filter((file) => file && file.path);

    //                 // if (validFiles.length === 0) {
    //                 //     return ErrorResponseHandler.sendErrorResponse(res, {
    //                 //         code: 'NO_VALID_FILES',
    //                 //         message: 'No valid files uploaded',
    //                 //         status: 400,
    //                 //     });
    //                 // }

    //                 // const uploadResults = validFiles.map((file) => ({
    //                 //     filename: file.originalname,
    //                 //     fileUrl: file.path
    //                 //         .replace(/ /g, '%20')
    //                 //         .replace(/\\/g, '/')
    //                 //         .replace(/^.*\/assets\//, '/assets/'),
    //                 // }));
    //                 // dataToCreate = uploadResults.map((result) => ({
    //                 //     screenId: folderName,
    //                 //     image: result.fileUrl,
    //                 //     subFolder: subFolderName,
    //                 //     fileName: result.filename,
    //                 // }));
    //             } else {
    //                 if (!req.file) {
    //                     return ErrorResponseHandler.sendErrorResponse(res, {
    //                         code: 'NO_FILES_UPLOADED',
    //                         message: 'No files uploaded',
    //                         status: 400
    //                     });
    //                 }

    //                 // const uploadResults = {
    //                 //     filename: req.file.originalname,
    //                 //     fileUrl: req.file.path.replace(/ /g, '%20').replace(/\\/g, '/').replace(/^.*\/assets\//, '/assets/'),
    //                 // };

    //                 // const fileUrl = req.file.path.replace(/ /g, '%20').replace(/\\/g, '/').replace(/^.*\/assets\//, '/assets/');
    //                 // dataToCreate = [{
    //                 //     screenId: folderName,
    //                 //     image: fileUrl,
    //                 //     subFolder: subFolderName,
    //                 //     fileName: req.file.originalname,
    //                 // }];
    //             }

    //             // logger.info('dataToCreate', { data: dataToCreate });
    //             // const createScreenShots = await Promise.all(
    //             //     dataToCreate.map(async (data: any) => {
    //             //         return await ScreenShotService.create(data);
    //             //     })
    //             // );
    //             // if (!createScreenShots || createScreenShots.length === 0) {
    //             //     return ErrorResponseHandler.sendErrorResponse(res, {
    //             //         code: 'FILE_UPLOAD_FAILED',
    //             //         message: 'File upload failed',
    //             //         status: 400
    //             //     });
    //             // }
    //         });

    //         // Handle S3 Upload
    //         s3UploadHandler(req, res, (err: any) => {
    //             if (err) {
    //                 return ErrorResponseHandler.sendErrorResponse(res, {
    //                     code: 'NO_FILES_UPLOADED',
    //                     message: 'File upload failed',
    //                     status: 400
    //                 });
    //             }

    //             if (isMultiple) {
    //                 if (!req.files || (req.files as any).length === 0) {
    //                     return ErrorResponseHandler.sendErrorResponse(res, {
    //                         code: 'NO_FILES_UPLOADED',
    //                         message: 'No files uploaded',
    //                         status: 400
    //                     });
    //                 }

    //                 const uploadResults = (req.files as any).filter((file: any) => file && file.location).map((file: any) => ({
    //                     filename: file.originalname,
    //                     fileUrl: file.location,
    //                 }));

    //                 return SuccessResponseHandler.sendSuccessResponse(res, { code: "OK", message: "Files uploaded successfully", status: 200 }, uploadResults);
    //             } else {
    //                 if (!req.file) {
    //                     return ErrorResponseHandler.sendErrorResponse(res, {
    //                         code: 'NO_FILES_UPLOADED',
    //                         message: 'No files uploaded',
    //                         status: 400
    //                     });
    //                 }

    //                 const uploadResults = {
    //                     filename: req.file.originalname,
    //                     fileUrl: (req.file as any).location,
    //                 };
    //                 return SuccessResponseHandler.sendSuccessResponse(res, { code: "OK", message: "File uploaded successfully", status: 200 }, uploadResults);
    //             }
    //         });
    //     } catch (error: any) {
    //         logger.error('Upload error:', { error: error });
    //         return ErrorResponseHandler.sendErrorResponse(res, error);
    //     }
    // }

    public async bucketImageUpload(req: Request, res: Response) {
        try {
            // Extract folder and sub-folder names from headers
            const folderName = req.headers["module"] as string;
            const subFolderName = req.headers["sub-folder"] as string;
            const pcClientType = req.headers['pcclienttype'] ? parseInt(req.headers['pcclienttype'].toString(), 10) : 1;
            const isMultiple = req.headers["upload-type"] === "multiple";
            const dateTime = req.headers["date-time"] ? req.headers["date-time"] : null;

            if (!folderName || !subFolderName) {
                return ErrorResponseHandler.sendErrorResponse(res, {
                    code: 'NOT_FOUND',
                    message: 'Module name and sub-folder name are required in headers',
                    status: 400
                });
            }

            let pcType = 'mainPc';
            if (pcClientType === 1 || pcClientType === 3 || pcClientType === 4) {
                pcType = 'mainPc';
            } else if (pcClientType === 2 || pcClientType === 5 || pcClientType === 6) {
                pcType = 'backupPc';
            }

            const currentTime = new Date().toISOString();

            // Initialize S3 Client
            const s3 = new S3Client({
                region: process.env.AWS_REGION,
                credentials: {
                    accessKeyId: process.env.AWS_S3_BUCKET_ACCESS_KEY!,
                    secretAccessKey: process.env.AWS_S3_BUCKET_SECRET_ACCESS_KEY!,
                },
            });

            // Ensure folder structure exists
            async function ensureFolderExists(folderPath: string) {
                const listParams = { Bucket: process.env.AWS_S3_BUCKET_NAME, Prefix: folderPath, MaxKeys: 1 };
                const folderExists = await s3.send(new ListObjectsV2Command(listParams));

                if (!folderExists.Contents || folderExists.Contents.length === 0) {
                    logger.info('Creating folder: ${folderPath}');
                    const createFolderParams = {
                        Bucket: process.env.AWS_S3_BUCKET_NAME,
                        Key: `${folderPath}/`, // S3 treats this as a folder
                        Body: "",
                    };
                    await s3.send(new PutObjectCommand(createFolderParams));
                }
            }

            const selectedDate = new Date().toISOString();
            const currentDate = new Date();

            let year = currentDate.getUTCFullYear();
            let month = (currentDate.getUTCMonth() + 1).toString().padStart(2, '0');
            let date = currentDate.getUTCDate().toString().padStart(2, '0');
            let hours = currentDate.getUTCHours().toString().padStart(2, '0');
            let minutes = currentDate.getUTCMinutes().toString().padStart(2, '0');
            let seconds = currentDate.getUTCSeconds().toString().padStart(2, '0');

            if (dateTime) {
                const dateComponents = this.service.extractDateComponentsFromFilename(dateTime);

                year = dateComponents.year;
                month = dateComponents.month;
                date = dateComponents.date;
                hours = dateComponents.hours;
                minutes = dateComponents.minutes;
                seconds = dateComponents.seconds;
            }

            await ensureFolderExists(folderName);
            await ensureFolderExists(`${folderName}/${pcType}`);
            await ensureFolderExists(`${folderName}/${pcType}/${subFolderName}`);
            await ensureFolderExists(`${folderName}/${pcType}/${subFolderName}/${year}`);
            await ensureFolderExists(`${folderName}/${pcType}/${subFolderName}/${year}/${month}`);
            await ensureFolderExists(`${folderName}/${pcType}/${subFolderName}/${year}/${month}/${date}`);
            await ensureFolderExists(`${folderName}/${pcType}/${subFolderName}/${year}/${month}/${date}/${hours}`);

            // Configure Multer-S3 Storage
            const s3Storage = multerS3({
                s3: s3,
                bucket: process.env.AWS_S3_BUCKET_NAME as string,
                contentType: multerS3.AUTO_CONTENT_TYPE,
                metadata: (req, file, cb) => {
                    cb(null, { fieldName: file.fieldname });
                },
                key: (req, file, cb) => {
                    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
                    const fileExt = path.extname(file.originalname);
                    const filename = `${path.basename(file.originalname, fileExt)}-${uniqueSuffix}${fileExt}`;

                    const accessType = ((req as any).headers['access-type'] as string) || PROJECT_CONFIG.S3_DEFAULT_ACCESS_TYPE;
                    const folderPrefix = accessType === 'public' ? 'public' : 'private';

                    cb(null, `${folderPrefix}/${folderName}/${pcType}/${subFolderName}/${year}/${month}/${date}/${hours}/${filename}`); // Store in correct sub-folder
                },
            });
            const now = new Date();
            const dateStr = `${year}-${month}-${date}`;
            // Configure Local Storage
            const localStorage = multer.diskStorage({
                destination: (req, file, cb) => {
                    const localFolderPath = path.join(__dirname, '../../../../assets/images', dateStr, pcType, subFolderName);
                    require('fs').mkdirSync(localFolderPath, { recursive: true });
                    cb(null, localFolderPath);
                },
                filename: (req, file, cb) => {
                    // const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
                    const fileExt = path.extname(file.originalname);
                    // const filename = `${path.basename(file.originalname, fileExt)}-${uniqueSuffix}${fileExt}`;

                    // const isoTimestamp = now.toISOString().replace(/:/g, '-').replace(/\.\d+Z$/, '');
                    const isoTimestamp = `${year}-${month}-${date}T${hours}-${minutes}-${seconds}`;

                    const filename = `${hours}-${isoTimestamp}-${subFolderName}-${pcType}${fileExt}`;
                    cb(null, filename);
                },
            });

            const uploadLocal = multer({ storage: localStorage });
            const uploadS3 = multer({ storage: s3Storage });

            const localUploadHandler = isMultiple ? uploadLocal.array("files", 10) : uploadLocal.single("file");
            const s3UploadHandler = isMultiple ? uploadS3.array("files", 10) : uploadS3.single("file");

            // Handle Local Upload
            localUploadHandler(req, res, async (localErr: any) => {
                if (localErr) {
                    return ErrorResponseHandler.sendErrorResponse(res, {
                        code: 'NO_FILES_UPLOADED',
                        message: 'File upload failed',
                        status: 400
                    });
                }

                if (isMultiple) {
                    const files = req.files as Express.Multer.File[] | undefined;
                    if (!files || files.length === 0) {
                        return ErrorResponseHandler.sendErrorResponse(res, {
                            code: 'NO_FILES_UPLOADED',
                            message: 'No files uploaded',
                            status: 400
                        });
                    }
                } else {
                    if (!req.file) {
                        return ErrorResponseHandler.sendErrorResponse(res, {
                            code: 'NO_FILES_UPLOADED',
                            message: 'No files uploaded',
                            status: 400
                        });
                    }
                }
            });

            // Handle S3 Upload
            s3UploadHandler(req, res, (err: any) => {
                if (err) {
                    return ErrorResponseHandler.sendErrorResponse(res, {
                        code: 'NO_FILES_UPLOADED',
                        message: 'File upload failed',
                        status: 400
                    });
                }

                if (isMultiple) {
                    const files = req.files as any[];
                    if (!files || files.length === 0) {
                        return ErrorResponseHandler.sendErrorResponse(res, {
                            code: 'NO_FILES_UPLOADED',
                            message: 'No files uploaded',
                            status: 400
                        });
                    }

                    const uploadResults = (files as any).filter((file: any) => file && file.location).map((file: any) => ({
                        filename: file.originalname,
                        fileUrl: file.location,
                    }));

                    return SuccessResponseHandler.sendSuccessResponse(res, { code: "OK", message: "Files uploaded successfully", status: 200 }, uploadResults);
                } else {
                    if (!req.file) {
                        return ErrorResponseHandler.sendErrorResponse(res, {
                            code: 'NO_FILES_UPLOADED',
                            message: 'No files uploaded',
                            status: 400
                        });
                    }

                    const uploadResults = {
                        filename: req.file.originalname,
                        fileUrl: (req.file as any).location,
                    };
                    return SuccessResponseHandler.sendSuccessResponse(res, { code: "OK", message: "File uploaded successfully", status: 200 }, uploadResults);
                }
            });
        } catch (error: any) {
            logger.error('Upload error:', { error: error });
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async bucketImageUploadAxisCameraGet(req: Request, res: Response) {
        try {
            // logger.info('===============================>', { data: "bucketImageUploadAxisCameraGet" });

            return SuccessResponseHandler.sendSuccessResponse(res, { code: "OK", message: "File uploaded successfully", status: 200 });
        } catch (error: any) {
            logger.error('Upload error:', { error: error });
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }

    public async bucketImageUploadAxisCamera(req: Request, res: Response) {
        try {
            const contentType = req.headers["content-type"];
            const contentDisposition = req.headers["content-disposition"];

            if (!contentType?.startsWith("image/") || !contentDisposition) {
                return res.status(400).json({ message: "Invalid headers" });
            }

            const filenameMatch = contentDisposition.match(/filename="?([^";\r\n]+)"?/);
            const filename = filenameMatch?.[1];
            if (!filename) {
                return res.status(400).json({ message: "Filename not found" });
            }

            const imageBuffer = req.body as Buffer;
            if (!Buffer.isBuffer(imageBuffer)) {
                return res.status(400).json({ message: "Invalid image data" });
            }

            // === Resize & compress image using Sharp ===
            const resizedBuffer = await sharp(imageBuffer)
                .resize({ width: 640 }) // Resize width to 640px
                .jpeg({ quality: 40 })  // Compress JPEG quality
                .toBuffer();

            // === S3 Upload ===
            const folderName = req.params.id;
            const now = new Date();
            const fullPath = `${folderName}/camera/${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}/${now.getHours()}/${filename}`;

            const s3 = new S3({
                region: process.env.AWS_REGION!,
                credentials: {
                    accessKeyId: process.env.AWS_S3_BUCKET_ACCESS_KEY!,
                    secretAccessKey: process.env.AWS_S3_BUCKET_SECRET_ACCESS_KEY!,
                },
            });

            const uploadResult = await s3.upload({
                Bucket: process.env.AWS_S3_BUCKET_NAME!,
                Key: fullPath,
                Body: resizedBuffer,
                ContentType: 'image/jpeg',
            }).promise();

            // === Local storage ===
            const localFolderPath = path.join(__dirname, '../../../../assets/images/screenshots', folderName, 'camera');
            fs.mkdirSync(localFolderPath, { recursive: true });

            const fileExt = path.extname(filename);
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            const localFilename = `${path.basename(filename, fileExt)}-${uniqueSuffix}.jpg`;
            const localFilePath = path.join(localFolderPath, localFilename);

            const currentHour = new Date().getUTCHours().toString().padStart(2, '0');
            const isoHourFolderPath = path.join(localFolderPath, currentHour);
            fs.mkdirSync(isoHourFolderPath, { recursive: true });

            const isoHourFilePath = path.join(isoHourFolderPath, localFilename);
            fs.writeFileSync(isoHourFilePath, resizedBuffer as any);

            // === Save to DB ===
            const dataToCreate = {
                screenId: new Types.ObjectId(req.params.id),
                image: isoHourFilePath.replace(/^.*\/assets\//, '/assets/'),
                subFolder: 'camera',
                fileName: localFilename,
            };

            return res.status(200).json({
                code: "OK",
                message: "File uploaded successfully",
                fileUrl: uploadResult.Location,
            });

        } catch (error: any) {
            logger.error('Upload error:', { error: error });
            return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }
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
