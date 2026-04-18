import Joi from 'joi';
import { IStaticPage } from '../interfaces/IStaticPage';
import { CommonValidator } from '../../common/validator/CommonValidator';

export class StaticPageValidators extends CommonValidator {

    public static readonly updateStaticPageSchema = Joi.object<Partial<IStaticPage>>({
        code: Joi.string().required(),
        description: Joi.string().required()
    });
}
