import joi from 'joi'

export const loginValidation = async (email: string, password: string): Promise<{ error: boolean, message: string }> => {
    const Schema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().required(),
    });
    const validate = Schema.validate({ email, password });
    let error: boolean = false;
    let message: string = '';
    if (validate.error) {
        message = validate.error.details[0].message;
        message = message.replace(/"/g, '');
        error = true;
    }
    return { error, message };
}

export const verifyLoginValidation = async (countryCode: string, mobileNumber: number, otp: number, email: string): Promise<{ error: boolean, message: string }> => {
    const Schema = joi.object({
        countryCode: joi.string()
            .pattern(/^(\+?\d{1,3}|\d{1,4})$/)
            .required()
            .messages({
                'string.pattern.base': 'Invalid country code format',
                'any.required': 'Country code is required',
            }),
        mobileNumber: joi.number()
            .integer()
            .max(10 ** 15 - 1)
            .required(),
        otp: joi.number().required(),
        email: joi.string().email().required(),
    })
    const validate = Schema.validate({ countryCode, mobileNumber, otp, email });
    let error: boolean = false;
    let message: string = '';
    if (validate.error) {
        message = validate.error.details[0].message;
        message = message.replace(/"/g, '');
        error = true;
    }
    return { error, message };
}