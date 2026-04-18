import Joi, { ObjectSchema, AlternativesSchema } from 'joi';
import { messages } from '../config/message';

export class CommonValidator {
    public static readonly PaginationOptionsSchema: ObjectSchema = Joi.object({
        page: Joi.number().integer().min(1),
        limit: Joi.number().integer().min(1),
        sortBy: Joi.object(),
    });

    public static readonly FilterValueSchema: AlternativesSchema = Joi.alternatives().try(
        Joi.string().allow(null, ''),
        Joi.number().allow(null, ''),
        Joi.boolean().allow(null, ''),
        Joi.object().allow(null, ''),
        Joi.array().allow(null, '')
    );

    public static readonly FilterSchema: ObjectSchema = Joi.object().pattern(/^/, CommonValidator.FilterValueSchema);

    public static readonly PaginateRequestSchema: ObjectSchema = Joi.object({
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).optional(),
        sortBy: Joi.object().optional(),
        search: Joi.object({
            keys: Joi.array().items(Joi.string()).optional(),
            keyword: Joi.string().optional().allow(null, ''),
        }).optional(),
        filter: CommonValidator.FilterSchema.optional(),
        populateFields: Joi.array().items(Joi.string()).optional(),
        selectFields: Joi.array().items(Joi.string()).optional(),
        startDate: Joi.string().optional().allow(null, ''),
        endDate: Joi.string().optional().allow(null, ''),
        module: Joi.string().optional().allow(null, '')
    });

    public static readonly idParamSchema = Joi.object({
        id: Joi.string().required(),
    });

    public checkRequiredParams(fields: string[], params: any) {
        for (let field of fields) {
            if (typeof params[field] !== 'boolean' && params[field] !== 0 && !params[field]) {
                throw messages.BAD_REQUEST;
            }
        }
    }
    public static readonly downloadReportSchema = Joi.object({
        module: Joi.string().required(),
        filter: CommonValidator.FilterSchema.optional(),
        search: Joi.object({
            keys: Joi.array().items(Joi.string()).optional(),
            keyword: Joi.string().optional().allow(null, ''),
        }).optional(),
        sortBy: Joi.object().optional(),
    });
}

export default new CommonValidator();