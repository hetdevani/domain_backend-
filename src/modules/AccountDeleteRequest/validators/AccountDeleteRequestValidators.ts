import Joi from 'joi';
import { IAccountDeleteRequest } from '../interfaces/IAccountDeleteRequest';
import { CommonValidator } from '../../common/validator/CommonValidator';

export class AccountDeleteRequestValidators extends CommonValidator {

    public static readonly createAccountDeleteRequestSchema = Joi.object<IAccountDeleteRequest>({
        // Add fields here for creating AccountDeleteRequest. Example:
        // fieldName: Joi.type().rules(),
    });

    public static readonly updateAccountDeleteRequestSchema = Joi.object<Partial<IAccountDeleteRequest>>({
        // Add fields here for updating AccountDeleteRequest. Example:
        // fieldName: Joi.type().rules(),
    });
}
