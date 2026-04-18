import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../constants/interface';
import logger from '../services/WinstonLogger';

export class ErrorHandler extends Error {
    code: string;
    status: number;
    data?: any;

    constructor(errorObj: ErrorResponse, data?: any) {
        super(errorObj.message);
        this.name = 'AppError';
        this.code = errorObj.code;
        this.status = errorObj.status;
        if (data) {
            this.data = data;
        }
    }

    static errorMiddleware(err: ErrorHandler, req: Request, res: Response, next: NextFunction) {
        logger.error('Error middleware caught error', {
            code: err.code,
            message: err.message,
            status: err.status,
            data: err.data,
            stack: err.stack,
            url: req.originalUrl,
            method: req.method
        });
        const { code, message, status, data } = err;
        const errorResponse: ErrorResponse = { code, message, status, data };
        return res.status(status).json(errorResponse);
    }
}
