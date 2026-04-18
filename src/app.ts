import express, { Express, NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import { ErrorHandler } from './modules/common/middleware/errorMiddleware';
import { PassportConfig } from './modules/auth/utils/PassportConfig';
import { routeConfig } from './routeConfig';
import databaseConfig from './databaseConfig';
import SeederService from './modules/seeder/services/SeederService';
import Container from './modules/common/services/Container';
import SeriesGeneratorService from './modules/SeriesGenerator/services/SeriesGeneratorService';
import CommonService from './modules/common/services/CommonService';
import MasterService from './modules/Master/services/MasterService';
import cronConfig from './modules/Cron/CronConfig';
import NotificationConfigService from './modules/common/services/NotificationConfigService';
import SocketManager from './modules/common/services/SocketConfigService';
import RedisService from './modules/common/services/RedisService';
import MessageFileToJsonConverter from './modules/common/services/MessageFileToJsonConverter';
import { LogMiddleware } from './modules/common/middleware/LogMiddleware';
import RequestContext from './modules/ActivityLog/utils/RequestContext';
import logger from './modules/common/services/WinstonLogger';

dotenv.config();

const isVercelServerless = process.env.VERCEL === '1' || process.env.VERCEL === 'true';

class App {
    public app: Express;
    public port: number;

    constructor() {
        this.app = express();
        this.app.use(cors({
            origin: (origin, callback) => {
                const allowedOrigins = [
                    'http://localhost:5173',
                    'http://localhost:3000',
                    process.env.ALLOWED_ORIGIN || '',
                ].filter(Boolean);
                // Allow requests with no origin (mobile apps, Postman, server-to-server)
                if (!origin || allowedOrigins.includes(origin) || (origin && origin.endsWith('.vercel.app'))) {
                    callback(null, true);
                } else {
                    callback(new Error(`CORS: Origin ${origin} not allowed`));
                }
            },
            credentials: true,
        }));
        this.app.set('trust proxy', 1);
        this.port = Number(process.env.PORT) || 1502;
        this.initializeMiddlewares();
        this.initializeHealthRoute();
        this.initializeContainer();
        this.initializeRoutes();
        this.updateModelLastUpdatedAtTime();
        this.initializeImageAccess();
        this.initializeRuntimeServices();
        // this.initializeMessageConverter();
    }

    private initializeDatabase() {
        databaseConfig.initializeDatabase().catch(err => logger.error('Error in initializeDatabase:', { err }));
    }

    private initializeCron() {
        cronConfig.configureCronsObj();
    }

    public updateModelLastUpdatedAtTime() {
        (global as any).MODEL_LAST_UPDATED_AT_TIME = {};
        (global as any).MASTER_ADMIN_ID = '';
        (global as any).VIRTUAL_VEHICLE_SETTING_AUTH_TOKEN = '';
        (global as any).GADDI_24_SETTING_AUTH_TOKEN = '';
    }

    private initializeUpdatedTimeForModels() {
        CommonService.setUpdatedTimeForModels().catch(err => logger.error('Error in setUpdatedTimeForModels:', { err }));
        CommonService.setAdminId().catch(err => logger.error('Error in setAdminId:', { err }));
    }

    private initializeSeeder() {
        SeederService.seederConfig().catch(err => logger.error('Error in seederConfig:', { err }));
    }

    private initializeHealthRoute() {
        this.app.get('/', (_req: Request, res: Response) => {
            res.status(200).json({
                ok: true,
                service: 'domain-backend',
                environment: process.env.NODE_ENV || 'development',
                serverless: isVercelServerless,
            });
        });
    }

    private initializeMiddlewares() {
        this.app.use(bodyParser.json({ limit: '50mb' }));
        this.app.use(cookieParser());

        // Request Context Middleware (stores IP, user agent, correlation ID for access anywhere)
        this.app.use(RequestContext.middleware);

        // Global Request Logging Middleware
        this.app.use(LogMiddleware.logRequest);

        this.app.use((err: ErrorHandler, req: Request, res: Response, next: NextFunction) => {
            ErrorHandler.errorMiddleware(err, req, res, next);
        });

        PassportConfig.configurePassport();

        // // Example of using CryptoUtils to encrypt and decrypt data
        // const encryptedData = CryptoUtils.encrypt('Hello, world!');
        // console.log('Encrypted data:', encryptedData);

        // const decryptedData = CryptoUtils.decrypt(encryptedData);
        // console.log('Decrypted data:', decryptedData);

        // Middleware for encrypting response data
        /* this.app.use((req: Request, res: Response, next: NextFunction) => {
                        const originalSend = res.send;
                        res.send = function (data: any) {
                                if (typeof data === 'object') {
                                        // Convert the response data to a JSON string
                                        const jsonStr = JSON.stringify(data);
 
                                        // Encrypt the JSON string using AES encryption
                                        const encryptedData = CryptoUtils.encrypt(jsonStr);
 
                                        // Base64 encode the encrypted data for safe transmission
                                        const encodedData = CryptoUtils.base64Encode(encryptedData);
 
                                        // Set the response header to indicate that the response is encrypted
                                        res.setHeader('X-Response-Encryption', 'AES');
 
                                        // Send the encoded data as the response
                                        originalSend.call(this, encodedData);
                                } else {
                                        originalSend.call(this, data);
                                }
                        };
 
                        next();
                });
 
                // Middleware for decrypting request data
                this.app.use((req: Request, res: Response, next: NextFunction) => {
                        const encryptionHeader = req.header('X-Request-Encryption');
                        if (encryptionHeader === 'AES') {
                                // Base64 decode the request data
                                const decodedData = CryptoUtils.base64Decode(req.body);
 
                                // Decrypt the decoded data using AES decryption
                                const decryptedData = CryptoUtils.decrypt(decodedData);
 
                                // Parse the decrypted JSON string back to an object
                                req.body = JSON.parse(decryptedData);
                        }
 
                        next(); 
                }); */

        // Middleware for encrypting response data
        // this.app.use((req: Request, res: Response, next: NextFunction) => {

        //     const originalSend = res.send;

        //     res.send = function (data: any): Response {                
        //         try {
        //             if (typeof data === "string") {
        //                 const encryptedData = CryptoService.encrypt(JSON.stringify(data));

        //                 return originalSend.call(this, JSON.stringify({ encryptedData })); // Return Response
        //             } else {
        //                 return originalSend.call(this, data); // Return Response
        //             }
        //         } catch (error) {
        //             console.error("Encryption error:", error);
        //             return originalSend.call(this, JSON.stringify({ error: "Encryption failed" }));
        //         }
        //     };

        //     next();
        // });

        // // Middleware for decrypting request data
        // this.app.use((req: Request, res: Response, next: NextFunction) => {

        //     if (req.body && Object.keys(req.body).length != 0 ) {

        //         // Base64 decode the request data
        //         const decodedData = CryptoService.decrypt(req.body);

        //         // Parse the decrypted JSON string back to an object
        //         req.body = JSON.parse(decodedData);
        //     }           
        //     next();
        // });

    }

    private initializeRoutes() {
        this.app.use('/api', routeConfig);
    }

    private initializeContainer() {
        Container.set('SeriesGeneratorService', SeriesGeneratorService);
        Container.set('MasterService', MasterService);
        Container.set('CommonService', CommonService);
    }

    private initializeRuntimeServices() {
        this.initializeDatabase();

        if (isVercelServerless) {
            logger.info('Skipping long-running startup services in Vercel serverless runtime');
            return;
        }

        this.initializeRedisService();
        this.initializeCron();
        this.initializeSeeder();
        this.initializeUpdatedTimeForModels();
        this.initializeNotificationConfig();
    }

    private initializeImageAccess() {
        this.app.use('/data', express.static('assets/data'));
        this.app.use('/images', express.static('assets/images'));
        this.app.use('/pc_client', express.static('assets/pc_client'));
        // this.app.use('/screenshots', express.static('assets/screenshots'));
    }

    public listen() {
        let server = this.app.listen(this.port, '0.0.0.0', () => {
            logger.info(`App listening on port ${this.port}`, { port: this.port, environment: process.env.NODE_ENV });
        });

        // Initialize SocketManager immediately
        const socketManager: any = SocketManager.initialize(server);
        (global as any).socketManager = socketManager;
        (global as any).requestManager = socketManager?.sendRequest;
        logger.info('Socket manager initialized', {
            hasSocketManager: !!socketManager,
            hasSendRequest: !!socketManager?.sendRequest,
            sendRequestType: typeof socketManager?.sendRequest
        });
    }

    private initializeRedisService() {
        RedisService.initializeClient();
        RedisService.resetDB().catch(err => logger.error('Error in resetDB:', { err }));
    }

    private initializeNotificationConfig() {
        NotificationConfigService.notificationConfigure();
    }

    private initializeMessageConverter() {
        const messageFilePaths = [
            '../../common/constants/message.ts',
            '../../User/message.ts',
            '../../Vehicle/message.ts',
        ];
        MessageFileToJsonConverter.createJsonFiles(messageFilePaths);
    }
}

export default App;
