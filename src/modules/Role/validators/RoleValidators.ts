import Joi from 'joi';
import { CommonValidator } from '../../common/validator/CommonValidator';

export class RoleValidators extends CommonValidator {
    public static readonly createRoleSchema = Joi.object({
        title: Joi.string().required(),
        userType: Joi.number().required(),
        permissions: Joi.array().items(
            Joi.object({
                module: Joi.number().required(),
                name: Joi.string().required(),
                permissions: Joi.object({
                    list: Joi.boolean().default(false),
                    view: Joi.boolean().default(false),
                    insert: Joi.boolean().default(false),
                    update: Joi.boolean().default(false),
                    delete: Joi.boolean().default(false),
                }).default({
                    list: false,
                    view: false,
                    insert: false,
                    update: false,
                    delete: false,
                }),
            })
        ).required(),
    });

    public static readonly updateRoleSchema = Joi.object({
        title: Joi.string().optional(),
        userType: Joi.number().optional(),
        permissions: Joi.array().items(
            Joi.object({
                module: Joi.number().required(),
                name: Joi.string().required(),
                permissions: Joi.object({
                    list: Joi.boolean().default(false),
                    view: Joi.boolean().default(false),
                    insert: Joi.boolean().default(false),
                    update: Joi.boolean().default(false),
                    delete: Joi.boolean().default(false),
                }).default({
                    list: false,
                    view: false,
                    insert: false,
                    update: false,
                    delete: false,
                }),
            })
        ).required(),
        isAppliedToAll: Joi.boolean().optional(),
    });

    public static readonly idParamSchema = Joi.object({
        id: Joi.string().required(),
    });
}
