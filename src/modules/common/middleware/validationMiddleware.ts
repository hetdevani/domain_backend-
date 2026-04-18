import { Request, Response, NextFunction } from 'express';
import { Schema, ValidationError } from 'joi';
import { ErrorResponse } from '../constants/interface';
import { ErrorResponseHandler } from '../response/errorResponse';
import logger from '../services/WinstonLogger';

export interface RouteConfig {
    path: string;
    method: 'post' | 'get' | 'put' | 'delete';
    middlewares?: ((req: Request, res: Response, next: NextFunction) => void)[]; // Allow multiple middlewares
    handler: (req: Request, res: Response) => Promise<any>;
}

export class ValidationMiddleware {
    public static validateRequest(schema: Schema, property: keyof Request = 'body') {

        return (req: Request, res: Response, next: NextFunction) => {
            const { error } = schema.validate(req[property]);
            logger.info('validate error ----', { hasError: !!error, errorDetails: error });
            const valid = (!error || error == null);

            if (valid) {
                next();
            } else {
                const { details } = error as ValidationError;
                const message = details.map((i) => i.message).join(',');

                logger.info('validation message', { data: message });
                const validationError: ErrorResponse = {
                    code: 'UNPROCESSABLE_ENTITY',
                    message: message,
                    status: 422,
                    data: {},
                };

                ErrorResponseHandler.sendErrorResponse(res, validationError);
                // next(validationError.message);
            }
        };
    }
}
