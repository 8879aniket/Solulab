import { Logger } from '@config/logger'
import Joi from 'joi'

export const adminRequest = async (data: Object) => {
	Logger.info('Inside create admin validator')

	const Schema = Joi.object({
		id: Joi.string().required(),
		name: Joi.string().required(),
		email: Joi.string().required(),
		mobileNumber: Joi.number().required(),
		countryCode: Joi.string().required(),
		role: Joi.string().required().valid('ADMIN'),
		accountType: Joi.string().required().valid('ADMIN', 'SUPER_ADMIN', 'PROJECT_DEVELOPER'),
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

export const updateAdminRequest = async (data: Object) => {
	Logger.info('Inside update admin validator')

	const Schema = Joi.object({
		name: Joi.string().required(),
		email: Joi.string().required(),
		mobileNumber: Joi.number().required(),
		countryCode: Joi.string().required(),
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
