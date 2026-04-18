import Joi from 'joi';
import { IVersionManager } from '../interfaces/IVersionManager';
import { CommonValidator } from '../../common/validator/CommonValidator';
import { name } from 'ejs';

export class VersionManagerValidators extends CommonValidator {

    public static readonly createVersionManagerSchema = Joi.object<IVersionManager>({
        file: Joi.string().required(),
        version: Joi.string().required(),
        description: Joi.string().required(),
        versionCode: Joi.number().required(),
        isActive: Joi.boolean().optional(),
        operatingSystem: Joi.number().required(),
        // Add fields here for creating VersionManager. Example:
        // fieldName: Joi.type().rules(),
    });

    public static readonly updateVersionManagerSchema = Joi.object<Partial<IVersionManager>>({
        file: Joi.string().required(),
        version: Joi.string().required(),
        description: Joi.string().required(),
        versionCode: Joi.number().required(),
        isActive: Joi.boolean().optional(),
        operatingSystem: Joi.number().required(),
        // Add fields here for updating VersionManager. Example:
        // fieldName: Joi.type().rules(),
    });
}
