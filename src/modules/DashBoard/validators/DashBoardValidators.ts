import Joi from 'joi';
import { CommonValidator } from '../../common/validator/CommonValidator';

export class DashBoardValidators extends CommonValidator {

    public static readonly createDashBoardSchema = Joi.object({
        // Add fields here for creating DashBoard. Example:
        // fieldName: Joi.type().rules(),
    });

    public static readonly updateDashBoardSchema = Joi.object({
        // Add fields here for updating DashBoard. Example:
        // fieldName: Joi.type().rules(),
    });

    public static readonly dateFilter = Joi.object({
        startDate: Joi.string().optional().allow(null, ''),
        endDate: Joi.string().optional().allow(null, ''),
    });

}
