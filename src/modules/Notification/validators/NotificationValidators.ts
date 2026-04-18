import Joi from 'joi';
import { CommonValidator } from '../../common/validator/CommonValidator';

export class NotificationValidators extends CommonValidator {

    public static readonly createNotificationSchema = Joi.object({
        title: Joi.string(),
        description: Joi.string(),
        userId: Joi.string().optional(),
        status: Joi.number(),
        type: Joi.number(),
        priority: Joi.number(),
    });
}
