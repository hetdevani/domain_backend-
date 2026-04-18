import Joi from 'joi';
import { ISetting } from '../interfaces/ISetting';
import { CommonValidator } from '../../common/validator/CommonValidator';

export class SettingValidators extends CommonValidator {

    public static readonly updateSettingSchema = Joi.object<Partial<ISetting>>({
        supportEmail: Joi.string().required(),
        supportMobileNumber: Joi.string().required()
    });

    public static readonly typeParamSchema = Joi.object({
        type: Joi.number().required(),
    });
}
