import { Logger } from '@config/logger'
import Joi from 'joi'

export const registerRequest = async (data: Object) => {
	Logger.info('Inside  register request validator')

	const Schema = Joi.object({
		id: Joi.string().required(),
		companyName: Joi.string().required(),
		companyRegistrationNumber: Joi.string().required(),
		companyWebsite: Joi.string().required(),
		country: Joi.string().required(),
		state: Joi.string().required(),
		postalCode: Joi.number().required(),
		email: Joi.string().required(),
		mobileNumber: Joi.number().required(),
		countryCode: Joi.string().required().messages({
			'any.required': 'Country code is required',
		}),
		password: Joi.string().required(),
		userType: Joi.string().required().valid('INVESTOR', 'PROJECT_DEVELOPER'),
		entityType: Joi.string().required().valid('INDIVIDUAL', 'COMPANY'),
	})

	const validate = Schema.validate(data)
	let error = false
	let message = 'Success Validation'

	if (validate.error) {
		message = validate.error.details[0].message
		message = message.replace(/"/g, '')
		error = true
	}

	return { error, message }
}

export const registerIndividualRequest = async (data: Object) => {
	Logger.info('Inside  register Individual request validator')

	const Schema = Joi.object({
		id: Joi.string().required(),
		name: Joi.string().required(),
		email: Joi.string().required(),
		country: Joi.string().required(),
		mobileNumber: Joi.number().required(),
		countryCode: Joi.string().required().messages({
			'any.required': 'Country code is required',
		}),
		password: Joi.string().required(),
		userType: Joi.string().required().valid('INVESTOR', 'PROJECT_DEVELOPER'),
		entityType: Joi.string().required().valid('INDIVIDUAL', 'COMPANY'),
		DOB: Joi.date().required(),
	})

	const validate = Schema.validate(data)
	let error = false
	let message = 'Success Validation'

	if (validate.error) {
		message = validate.error.details[0].message
		message = message.replace(/"/g, '')
		error = true
	}

	return { error, message }
}

export const loginValidation = async (
	data: Object
): Promise<{ error: boolean; message: string }> => {
	Logger.info('Inside login validator')
	const Schema = Joi.object({
		email: Joi.string().email().required(),
		password: Joi.string().required(),
	})
	const validate = Schema.validate(data)
	let error: boolean = false
	let message: string = ''
	if (validate.error) {
		message = validate.error.details[0].message
		message = message.replace(/"/g, '')
		error = true
	}
	return { error, message }
}

export const verifyLoginValidation = async (payload: {
	countryCode: string
	mobileNumber: number
	otp: number
	email: string
	fcmToken: string
}): Promise<{ error: boolean; message: string }> => {
	Logger.info('Inside verify Login validator')
	const Schema = Joi.object({
		countryCode: Joi.string().required().messages({
			'any.required': 'Country code is required',
		}),
		mobileNumber: Joi.number()
			.integer()
			.max(10 ** 15 - 1)
			.required(),
		otp: Joi.number().required(),
		email: Joi.string().email().required(),
		fcmToken: Joi.string().allow(''),
	})
	const validate = Schema.validate(payload)
	let error: boolean = false
	let message: string = ''
	if (validate.error) {
		message = validate.error.details[0].message
		message = message.replace(/"/g, '')
		error = true
	}
	return { error, message }
}

export const mobileOtpValidation = async (payload: {
	countryCode: string
	mobileNumber: number
}) => {
	Logger.info('inside mobile otp validation')

	const Schema = Joi.object({
		countryCode: Joi.string().required().messages({
			'any.required': 'Country code is required',
		}),
		mobileNumber: Joi.number()
			.integer()
			.max(10 ** 15 - 1)
			.required(),
		email: Joi.string().email().optional(),
	})
	const validate = Schema.validate(payload)
	let error: boolean = false
	let message: string = ''
	if (validate.error) {
		message = validate.error.details[0].message
		message = message.replace(/"/g, '')
		error = true
	}
	return { error, message }
}

export const emailValidation = async (data: {
	email: string
}): Promise<{ error: boolean; message: string }> => {
	Logger.info('inside email otp validation')
	const Schema = Joi.object({
		email: Joi.string().email().required(),
	})
	const validate = Schema.validate(data)
	let error: boolean = false
	let message: string = ''
	if (validate.error) {
		message = validate.error.details[0].message
		message = message.replace(/"/g, '')
		error = true
	}
	return { error, message }
}
export const forgotPasswordValidation = async (data: Object) => {
	Logger.info('Inside forgot password validator')

	const Schema = Joi.object({
		email: Joi.string().required(),
	})

	const validate = Schema.validate(data)
	// await sendResponse(validate);
	let error = false
	let message = ''

	if (validate.error) {
		message = validate.error.details[0].message
		message = message.replace(/"/g, '')
		error = true
	}
	return { error, message }
}

export const resetPasswordRequest = async (data: Object) => {
	Logger.info('Inside reset password validator')

	const Schema = Joi.object({
		resetId: Joi.string().required(),
		password: Joi.string().required(),
	})

	const validate = Schema.validate(data)
	// await sendResponse(validate);
	let error = false
	let message = ''

	if (validate.error) {
		message = validate.error.details[0].message
		message = message.replace(/"/g, '')
		error = true
	}
	return { error, message }
}

export const updateUserValidation = async (data: Object) => {
	Logger.info('Inside update User validator')

	const Schema = Joi.object({
		companyName: Joi.string(),
		companyRegistrationNumber: Joi.string(),
		companyWebsite: Joi.string(),
		country: Joi.string(),
		state: Joi.string(),
		postalCode: Joi.number(),
		name: Joi.string(),
		kycStatus: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED'),
		DOB: Joi.date(),
		profilePic: Joi.string(),
		isPurchaser: Joi.boolean(),
		isBlocked: Joi.boolean(),
		kycVerificationId: Joi.string().allow(null),
		lastLogout: Joi.date(),
		fcmToken: Joi.string(),
		addressLine1: Joi.string(),
		addressLine2: Joi.string(),
		firstLogin: Joi.boolean(),
	})

	const validate = Schema.validate(data)
	let error = false
	let message = 'Success Validation'

	if (validate.error) {
		message = validate.error.details[0].message
		message = message.replace(/"/g, '')
		error = true
	}

	return { error, message }
}

export const updateEchoUserValidation = async (data: Object) => {
	Logger.info('Inside update Echo User validator')

	const Schema = Joi.object({
		echoStartDate: Joi.date(),
		echoEndDate: Joi.date(),
		isEchoSubscribed: Joi.boolean(),
		isEchoBlocked: Joi.boolean(),
	})

	const validate = Schema.validate(data)
	let error = false
	let message = 'Success Validation'

	if (validate.error) {
		message = validate.error.details[0].message
		message = message.replace(/"/g, '')
		error = true
	}

	return { error, message }
}

export const changePasswordValidation = async (data: Object) => {
	Logger.info('Inside create password validator')

	const Schema = Joi.object({
		oldPassword: Joi.string().required(),
		newPassword: Joi.string().required(),
	})

	const validate = Schema.validate(data)
	let error = false
	let message = ''

	if (validate.error) {
		message = validate.error.details[0].message
		message = message.replace(/"/g, '')
		error = true
	}
	return { error, message }
}

export const createEchoUserValidation = async (data: Object) => {
	Logger.info('Inside create EchoUser Validatior')

	const Schema = Joi.object({
		name: Joi.string().required(),
		email: Joi.string().required(),
		echoStartDate: Joi.date(),
		echoEndDate: Joi.date(),
		isEchoSubscribed: Joi.boolean().required(),
	})

	const validate = Schema.validate(data)
	let error = false
	let message = 'Success Validation'

	if (validate.error) {
		message = validate.error.details[0].message
		message = message.replace(/"/g, '')
		error = true
	}

	return { error, message }
}

export const priceLastUpdatedValidation = async (data: Object) => {
	Logger.info('Inside price Last Updated validator')

	const Schema = Joi.object({
		priceLastUpdatedAt: Joi.date(),
	})

	const validate = Schema.validate(data)
	let error = false
	let message = 'Success Validation'

	if (validate.error) {
		message = validate.error.details[0].message
		message = message.replace(/"/g, '')
		error = true
	}

	return { error, message }
}

export const createNewUserValidator = async (data: Object) => {
	Logger.info('Inside create NewUser validator')

	const Schema = Joi.object({
		email: Joi.string().email().required(),
		password: Joi.string().required(),
		userType: Joi.string().valid('INVESTOR', 'PROJECT_DEVELOPER').required(),
	})

	const validate = Schema.validate(data)
	let error = false
	let message = 'Success Validation'

	if (validate.error) {
		message = validate.error.details[0].message
		message = message.replace(/"/g, '')
		error = true
	}

	return { error, message }
}
export const twoFAUpdateRequestValidation = async (data: Object) => {
	Logger.info('Inside  twoFA Update Request Validation validator')

	const Schema = Joi.object({
		twoFAType: Joi.string().valid('NONE', 'AUTH', 'SMS').required(),
	})

	const validate = Schema.validate(data)

	let error = false
	let message = 'Success Validation'

	if (validate.error) {
		message = validate.error.details[0].message
		message = message.replace(/"/g, '')
		error = true
	}

	return { error, message }
}

export const securityUpdateRequestValidation = async (data: Object) => {
	Logger.info('Inside  security Update Request Validation validator')

	const Schema = Joi.object({
		method: Joi.string().required().valid('NONE', 'AUTH', 'SMS'),
		code: Joi.number().when('method', {
			is: Joi.string().valid('SMS', 'AUTH'),
			then: Joi.number().required(),
			otherwise: Joi.number().forbidden(),
		}),
	})

	const validate = Schema.validate(data)

	let error = false
	let message = 'Success Validation'

	if (validate.error) {
		message = validate.error.details[0].message
		message = message.replace(/"/g, '')
		error = true
	}
	return { error, message }
}

export const newUserloginRequestValidate = async (data) => {
	Logger.info('Inside new user login Request validator')
	const Schema = Joi.object({
		email: Joi.string().email().required(),
		password: Joi.string().required(),
	})

	const validate = Schema.validate(data)

	let error = false
	let message = ''

	if (validate.error) {
		message = validate.error.details[0].message
		message = message.replace(/"/g, '')
		error = true
	}
	return { error, message }
}

export const sendEmailValidation = async (data: Object) => {
	Logger.info('Inside send Email Validation validator')

	const Schema = Joi.object({
		email: Joi.string().email().required(),
	})

	const validate = Schema.validate(data)

	let error = false
	let message = ''

	if (validate.error) {
		message = validate.error.details[0].message
		message = message.replace(/"/g, '')
		error = true
	}
	return { error, message }
}

export const userVerifyLoginValisdation = async (data: Object) => {
	Logger.info('inside user verify login controller')
	const Schema = Joi.object({
		email: Joi.string().email().required(),
		code: Joi.number().required(),
	})

	const validate = Schema.validate(data)

	let error = false
	let message = ''

	if (validate.error) {
		message = validate.error.details[0].message
		message = message.replace(/"/g, '')
		error = true
	}
	return { error, message }
}

export const updateUserKYBValidator = async (data) => {
	Logger.info('Inside update User KYB validator')
	const Schema = Joi.object({
		companyName: Joi.string().required(),
		companyRegistrationNumber: Joi.string().required(),
		companyWebsite: Joi.string().required(),
		state: Joi.string().required(),
		countryCode: Joi.string().required().messages({
			'any.required': 'Country code is required',
		}),
		firstname: Joi.string().required(),
		lastname: Joi.string().required(),
		address1: Joi.string().required(),
		houseNameNumber: Joi.string().required(),
		city: Joi.string().required(),
		title: Joi.string().required().valid('Mr', 'Ms'),
		gender: Joi.string().required().valid('Male', 'Female'),
		memorableWord: Joi.string().required(),
		primaryContactNo: Joi.string().required(),
		dateOfBirth: Joi.string().required(),
		product: Joi.string().required().valid('MoneyTransfer'),
		mobileNumber: Joi.string().required(),
		caxtonPassword: Joi.string().required(),
		postcode: Joi.string().required(),
		country: Joi.string().required(),
	})

	const validate = Schema.validate(data)

	let error = false
	let message = ''

	if (validate.error) {
		message = validate.error.details[0].message
		message = message.replace(/"/g, '')
		error = true
	}
	return { error, message }
}
