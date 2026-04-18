import Joi from 'joi';

export class AuthValidators {

    public static readonly validateMasterPasswordSchema: Joi.ObjectSchema<any> = Joi.object({
        password: Joi.string().required()
    });

    public static readonly validateScreenSchema = Joi.object({
        screenId: Joi.string().required(),
        pcClientType: Joi.number().optional().allow(null, ""),
    });

    public static readonly loginViaOTPSchema: Joi.ObjectSchema<any> = Joi.object({
        username: Joi.string().required(),
        otp: Joi.string().required(),
    });

    public static readonly loginViaUsernameAndPasswordSchema: Joi.ObjectSchema<any> = Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required(),
    });

    public static readonly authenticateRegisteredUserSchema: Joi.ObjectSchema<any> = Joi.object({
        username: Joi.string().required()
    });

    public static readonly authenticateOtpVerificationSchema: Joi.ObjectSchema<any> = Joi.object({
        username: Joi.string().required(),
        otp: Joi.string().required(),
        secretKey: Joi.string().optional().allow(null, "")
    });

    public static readonly sendOtpToUserSchema: Joi.ObjectSchema<any> = Joi.object({
        username: Joi.string().required(),
    });

    public static readonly forgotPasswordSchema: Joi.ObjectSchema<any> = Joi.object({
        username: Joi.string().required(),
    });

    public static readonly resetPasswordSchema: Joi.ObjectSchema<any> = Joi.object({
        username: Joi.string().required(),
        token: Joi.string().required(),
        newPassword: Joi.string().required(),
    });

    public static readonly verifyOTPdSchema: Joi.ObjectSchema<any> = Joi.object({
        username: Joi.string().required(),
        token: Joi.string().required(),
    });

    public static readonly registerCustomerSchema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().required().email(),
        countryCode: Joi.string().optional().allow(null, ''),
        mobile: Joi.string().optional().allow(null, ''),
    });

}

// Add other authentication-related validation schemas here if needed
