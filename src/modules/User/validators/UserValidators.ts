import Joi from 'joi';
import { IUser, PermissionModule, Permissions } from '../interfaces/IUser';
import { CommonValidator } from '../../common/validator/CommonValidator';
import { USER_TYPES } from '../../common/constants/common';

export class UserValidators extends CommonValidator {

    private static readonly permissionModuleSchema = Joi.object<PermissionModule>({
        module: Joi.number().required(),
        name: Joi.string().required(),
        permissions: Joi.object<Permissions>({
            list: Joi.boolean().required(),
            view: Joi.boolean().required(),
            insert: Joi.boolean().required(),
            update: Joi.boolean().required(),
            delete: Joi.boolean().required(),
        }).required(),
    });

    public static readonly createUserSchema = Joi.object<IUser>({
        name: Joi.string().required(),
        type: Joi.number().required(),
        email: Joi.string().required().email(),
        password: Joi.when('type', {
            is: USER_TYPES.CUSTOMER,
            then: Joi.string().optional().allow(null),
            otherwise: Joi.string().required().min(8)
        }),
        // password: Joi.string().required().min(8),
        image: Joi.string().optional().allow(null, ''),
        mobile: Joi.string().optional().allow(null, ''),
        countryCode: Joi.string().optional().allow(null, ''),
    });

    public static readonly updateUserSchema = Joi.object<Partial<IUser>>({
        name: Joi.string().optional().allow(null, ''),
        email: Joi.string().optional().allow(null, ''),
        mobile: Joi.string().optional().allow(null, ''),
        countryCode: Joi.string().optional().allow(null, ''),
        type: Joi.number().optional().allow(null, ''),
        image: Joi.string().optional().allow(null, ''),
        accessPermission: Joi.array().items(UserValidators.permissionModuleSchema).optional(),
    });

    public static readonly syncUserSchema: Joi.ObjectSchema<any> = Joi.object({
        lastSyncDate: Joi.string().required(),
    });

    public static readonly resetPasswordSchema: Joi.ObjectSchema<any> = Joi.object({
        id: Joi.string().required(),
        newPassword: Joi.string().required().min(8),
    });

    public static readonly userListSchema: Joi.ObjectSchema<any> = Joi.object({
        filter: CommonValidator.FilterSchema.optional()
    });

    public static readonly googleDirectionSchema = Joi.object({
        origin: Joi.string().required(),
        destination: Joi.string().required(),
        mode: Joi.string().required()
    });
}
