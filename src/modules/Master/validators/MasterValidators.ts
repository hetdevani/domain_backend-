import Joi from 'joi';
import { IMaster } from '../interfaces/IMaster';
import { CommonValidator } from '../../common/validator/CommonValidator';

export class MasterValidators extends CommonValidator {

    public static readonly createMasterSchema = Joi.object<IMaster>({
        name: Joi.string().required(),
        normalizeName: Joi.string().optional(),
        code: Joi.string().required(),
        group: Joi.string().allow('', null),
        description: Joi.string().allow('', null),
        isActive: Joi.boolean().default(true),
        isDeleted: Joi.boolean().default(false),
        isDefault: Joi.boolean().default(false),
        sortingSequence: Joi.number().optional(),
        image: Joi.string().allow('', null),
        icon: Joi.string().allow('', null),
        parentId: Joi.string().allow(null),
        // multiLanguageData: Joi.object().default({}),
    });

    public static readonly updateMasterSchema = Joi.object<Partial<IMaster>>({
        name: Joi.string().required(),
        normalizeName: Joi.string().optional(),
        code: Joi.string().required(),
        group: Joi.string().allow('', null),
        description: Joi.string().allow('', null),
        isActive: Joi.boolean(),
        isDeleted: Joi.boolean(),
        isDefault: Joi.boolean(),
        sortingSequence: Joi.number().optional(),
        image: Joi.string().allow('', null),
        icon: Joi.string().allow('', null),
        parentId: Joi.string().allow(null),
        // multiLanguageData: Joi.object(),
    });

    public static readonly viewMasterSchema = Joi.object<Partial<IMaster>>({
        name: Joi.string(),
        code: Joi.string()
    });
}
