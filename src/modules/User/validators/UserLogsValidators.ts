import Joi from 'joi';
import { IUserLogs } from '../interfaces/IUserLogs';
import { CommonValidator } from '../../common/validator/CommonValidator';

export class UserLogsValidators extends CommonValidator {

    public static readonly createUserLogsSchema = Joi.object({
        userLocation: Joi.object({
            lat: Joi.number().required(),
            lng: Joi.number().required()
        }).required(),
    });

}
