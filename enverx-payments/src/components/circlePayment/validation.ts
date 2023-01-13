import { Logger } from '@config/logger'
import Joi from 'joi'

export const createWalletValidation = async (data: Object) => {
	Logger.info('Inside  Create Wallet validator')

	const Schema = Joi.object({
		idempotencyKey: Joi.string().required(),
		description: Joi.string().required(),
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

export const createWirePaymentValidation = async (data: Object) => {
	Logger.info('Inside  Create Wire Payment validator')

	const Schema = Joi.object({
		userId: Joi.string().required(),
		trackingRef: Joi.string().required(),
		accountId: Joi.string().required(),
		amount: Joi.string().required(),
		currency: Joi.string().required(),
		bankName: Joi.string().required(),
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

export const createTransferValidation = async (data: Object) => {
	Logger.info('Inside  Create Transfer validator')

	const Schema = Joi.object({
		sourceWalletId: Joi.string().required(),
		sourceType: Joi.string().required(),
		destinationWalletId: Joi.string().required(),
		destinationType: Joi.string().required(),
		amount: Joi.string().required(),
		userId: Joi.string().required(),
		currency: Joi.string().required(),
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

export const createPayoutValidation = async (data: Object) => {
	Logger.info('Inside  Create Transfer validator')

	const Schema = Joi.object({
		sourceType: Joi.string().required(),
		sourceId: Joi.string().required(),
		destinationType: Joi.string().required(),
		detsinationId: Joi.string().required(),
		amount: Joi.string().required(),
		userId: Joi.string().required(),
		currency: Joi.string().required(),
		beneficiaryEmail: Joi.string().required(),
		bankName: Joi.string().required(),
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

export const createAccessTokenValidation = async (data: Object) => {
	Logger.info('Inside  Create Access Token validator')

	const Schema = Joi.object({
		publicToken: Joi.string().required(),
		userId: Joi.string().required(),
		accountId: Joi.string().required(),
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

export const createACHPaymentValidation = async (data: Object) => {
	Logger.info('Inside  Create ACH Payment validator')

	const Schema = Joi.object({
		ipAddress: Joi.string().required(),
		amount: Joi.string().required(),
		currency: Joi.string().required(),
		accountType: Joi.string().required(),
		accountId: Joi.string().required(),
		userId: Joi.string().required(),
		bankName: Joi.string().required(),
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
