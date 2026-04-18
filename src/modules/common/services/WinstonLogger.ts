import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import RequestContext from '../../ActivityLog/utils/RequestContext';

const isServerlessRuntime = process.env.VERCEL === '1' || process.env.VERCEL === 'true' || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

/**
 * Winston Logger Service
 * Centralized logging service for the entire application
 */
class WinstonLogger {
    private logger: winston.Logger;
    private static instance: WinstonLogger;

    constructor() {
        // Define custom log levels
        const customLevels = {
            levels: {
                error: 0,
                warn: 1,
                info: 2,
                http: 3,
                debug: 4,
            },
            colors: {
                error: 'red',
                warn: 'yellow',
                info: 'green',
                http: 'magenta',
                debug: 'blue',
            },
        };

        // Add colors to winston
        winston.addColors(customLevels.colors);

        // Define log format
        const logFormat = winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.errors({ stack: true }),
            winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
            winston.format.printf((info) => {
                const { timestamp, level, message, metadata } = info;

                // Get correlation ID from request context
                const correlationId = RequestContext.getCorrelationId();
                const traceId = RequestContext.getTraceId();

                let log = `[${timestamp}] [${level.toUpperCase()}]`;

                if (correlationId) {
                    log += ` [CID: ${correlationId.slice(0, 8)}]`;
                }

                if (traceId) {
                    log += ` [TID: ${traceId.slice(0, 8)}]`;
                }

                log += `: ${message}`;

                // Add metadata if present
                if (metadata && Object.keys(metadata).length > 0) {
                    log += ` | ${JSON.stringify(metadata)}`;
                }

                return log;
            })
        );

        // Console format with colors
        const consoleFormat = winston.format.combine(
            winston.format.colorize({ all: true }),
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.printf((info) => {
                const { timestamp, level, message, metadata } = info;

                const correlationId = RequestContext.getCorrelationId();
                const traceId = RequestContext.getTraceId();

                let log = `[${timestamp}] ${level}`;

                if (correlationId) {
                    log += ` [CID: ${correlationId.slice(0, 8)}]`;
                }

                if (traceId) {
                    log += ` [TID: ${traceId.slice(0, 8)}]`;
                }

                log += `: ${message}`;

                if (metadata && Object.keys(metadata).length > 0) {
                    log += ` | ${JSON.stringify(metadata, null, 2)}`;
                }

                return log;
            })
        );

        // Create logs directory if it doesn't exist
        // Create transports array
        const transports: winston.transport[] = [];

        if (process.env.NODE_ENV === 'production' && !isServerlessRuntime) {
            const logsDir = path.join(process.cwd(), 'logs');

            // Daily rotate file transport for all logs
            const allLogsTransport = new DailyRotateFile({
                filename: path.join(logsDir, 'application-%DATE%.log'),
                datePattern: 'YYYY-MM-DD',
                zippedArchive: true,
                maxSize: '20m',
                maxFiles: '14d',
                format: logFormat,
            });

            // Daily rotate file transport for error logs
            const errorLogsTransport = new DailyRotateFile({
                filename: path.join(logsDir, 'error-%DATE%.log'),
                datePattern: 'YYYY-MM-DD',
                zippedArchive: true,
                maxSize: '20m',
                maxFiles: '30d',
                level: 'error',
                format: logFormat,
            });

            // Daily rotate file transport for HTTP logs
            const httpLogsTransport = new DailyRotateFile({
                filename: path.join(logsDir, 'http-%DATE%.log'),
                datePattern: 'YYYY-MM-DD',
                zippedArchive: true,
                maxSize: '20m',
                maxFiles: '7d',
                level: 'http',
                format: logFormat,
            });

            // In production, log to files with defined retention periods
            transports.push(allLogsTransport, errorLogsTransport, httpLogsTransport);
        } else {
            // In development and serverless runtimes, only log to console.
            transports.push(
                new winston.transports.Console({
                    format: consoleFormat,
                })
            );
        }

        // Create the logger
        this.logger = winston.createLogger({
            levels: customLevels.levels,
            level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
            transports,
            exitOnError: false,
        });
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): WinstonLogger {
        if (!WinstonLogger.instance) {
            WinstonLogger.instance = new WinstonLogger();
        }
        return WinstonLogger.instance;
    }

    /**
     * Log error message
     */
    public error(message: string, meta?: any): void {
        this.logger.error(message, meta);
    }

    /**
     * Log warning message
     */
    public warn(message: string, meta?: any): void {
        this.logger.warn(message, meta);
    }

    /**
     * Log info message
     */
    public info(message: string, meta?: any): void {
        this.logger.info(message, meta);
    }

    /**
     * Log HTTP request/response
     */
    public http(message: string, meta?: any): void {
        this.logger.http(message, meta);
    }

    /**
     * Log debug message
     */
    public debug(message: string, meta?: any): void {
        this.logger.debug(message, meta);
    }

    /**
     * Log with custom level
     */
    public log(level: string, message: string, meta?: any): void {
        this.logger.log(level, message, meta);
    }

    /**
     * Get the underlying Winston logger instance
     */
    public getLogger(): winston.Logger {
        return this.logger;
    }
}

// Export singleton instance
const logger = WinstonLogger.getInstance();
export default logger;
