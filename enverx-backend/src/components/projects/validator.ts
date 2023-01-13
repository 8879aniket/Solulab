import Joi from 'joi'

import { Logger } from '@config/logger'

export const validateProject = async (step: number, payload: object) => {
	Logger.info('Inside project validate')
	const Schema = Joi.object({
		// TODO: we will keep only step 6 is valid in future
		step: Joi.number().valid(1, 2, 3, 4, 5, 6).required(),
		title: Joi.string().allow(null).required(),
		state: Joi.string().allow(null).optional(),
		city: Joi.string().allow(null).optional(),
		postal_code: Joi.string().allow(null).optional(),
		address: Joi.string().allow(null).optional(),
		country: Joi.string().allow(null).optional(),
		vintage: Joi.date().allow(null).optional(),
		latitude: Joi.number().allow(null).optional(),
		longitude: Joi.number().allow(null).optional(),
		registry: Joi.string().insensitive().optional(),
		standard: Joi.string().allow(null).optional(),
		type: Joi.string().valid().allow(null).optional(),
		methodology: Joi.string().allow(null).optional(),
		scale: Joi.string().allow(null).optional(),
		activity: Joi.string().allow(null).optional(),
		length: Joi.number().allow(null).optional(),
		project_details_doc: Joi.string().allow(null).optional(),
		project_images: Joi.array().items(Joi.string()).allow(null).optional(),
		project_logo: Joi.string().allow(null).optional(),
		other_docs: Joi.array().items(Joi.string()).allow(null).optional(),
		payment_method: Joi.string().allow(null).optional(),
		account_type: Joi.string().valid('US', 'IBAN', 'NON_IBAN').allow(null).optional(),
		account_number: Joi.string().allow(null).optional(),
		routing_number: Joi.string().allow(null).optional(),
		bank_country: Joi.string().allow(null).optional(),
		bank_name: Joi.string().allow(null).optional(),
		bank_city: Joi.string().allow(null).optional(),
		iban: Joi.number().allow(null).optional(),
		plaid_token: Joi.string().allow(null).optional(),
		billing_name: Joi.string().allow(null).optional(),
		billing_country: Joi.string().allow(null).optional(),
		billing_city: Joi.string().allow(null).optional(),
		billing_address1: Joi.string().allow(null).optional(),
		billing_address2: Joi.string().allow(null).optional(),
		billing_postal_code: Joi.number().allow(null).optional(),
		billing_district: Joi.string().allow(null).optional(),
		bank_district: Joi.string().allow(null).optional(),
		seed_credits: Joi.number().allow(null).optional(),
		expected_credit_date: Joi.date().allow(null).optional(),
		raise_amount: Joi.number().allow(null).optional(),
		total_project_raise_amount: Joi.number().allow(null).optional(),
		price_per_token: Joi.number().allow(null).optional(),
		platform_fees: Joi.string().allow(null).optional(),
		pre_verification_cost: Joi.string().allow(null).optional(),
		vvb_fees: Joi.string().allow(null).optional(),
		userId: Joi.string().required(),
		project_type: Joi.string().valid('Planning', 'Pipeline', 'Realised').required(),
		project_sub_type: Joi.string().required(),
		registryLogo: Joi.string().allow(''),
	})

	const validate = Schema.validate({ step, ...payload })
	let error = false
	let message = 'Success Validation'

	if (validate.error) {
		message = validate.error.details[0].message
		message = message.replace(/"/g, '')
		error = true
	}

	return { error, message }
}

export const updateProjectByAdminValidation = async (payload: any) => {
	Logger.info('Inside Update Project By Admin validator')

	const Schema = Joi.object({
		projectId: Joi.number().required(),
		short_description: Joi.string().allow(null).optional(),
		exact_address: Joi.string().allow(null).optional(),
		video: Joi.string().allow(null).optional(),
		project_size: Joi.number().allow(null).optional(),
		man_power: Joi.number().allow(null).optional(),
		farm_type: Joi.string().allow(null).optional(),
		approach: Joi.string().allow(null).optional(),
		key_activities: Joi.string().allow(null).optional(),
		sdg_commitments: Joi.array().items(Joi.string()).allow(null).optional(),
		impact_areas: Joi.array().items(Joi.string()).allow(null).optional(),
		area_offset_generation: Joi.number().allow(null).optional(),
		min_annual_sequestration: Joi.number().allow(null).optional(),
		max_annual_sequestration: Joi.number().allow(null).optional(),
		per_year_annual_sequestration: Joi.number().allow(null).optional(),
		total_credits_over_project: Joi.number().allow(null).optional(),
		certification_date: Joi.string().allow(null).optional(),
		additional_certification: Joi.string().allow(null).optional(),
		registry_project_id: Joi.string().allow(null).optional(),
		large_description: Joi.string().allow(null).optional(),
		year_of_projection: Joi.string().allow(null).optional(),
		projection: Joi.string().allow(null).optional(),
		additional_note: Joi.string().allow(null).optional(),
		additional_documents: Joi.array().items(Joi.string()).allow(null).optional(),
		typeOfReview: Joi.string().allow(null).optional(),
		totalNoOfInvestors: Joi.number().allow(null).optional(),
		platform_fees: Joi.string().allow(null).optional(),
		pre_verification_cost: Joi.string().allow(null).optional(),
		vvb_fees: Joi.string().allow(null).optional(),
		price_per_token: Joi.number().allow(null).optional(),
	})

	const validate = Schema.validate(payload)
	let error = false
	let message = 'Success Validation'

	if (validate.error) {
		message = validate.error.details[0].message
		message = message.replace(/"/g, '')
		error = true
	}

	return { error, message }
}

export const validateProjectApproval = async (option: string, payload: any) => {
	Logger.info('Inside validate project validator')

	const Schema = Joi.object({
		option: Joi.string()
			.required()
			.valid(
				'submitProject',
				'unapprovedProject',
				'verificationPending',
				'adminReview',
				'seedApproved'
			),
		payload: Joi.required().allow().when('option', {
			is: 'submitProject',
			then: Joi.number(),
			otherwise: Joi.string(),
		}),
	})

	const validate = Schema.validate({ option, payload })
	let error = false
	let message = 'Success Validation'

	if (validate.error) {
		message = validate.error.details[0].message
		message = message.replace(/"/g, '')
		error = true
	}

	return { error, message }
}

export const preVerificationApprovalValidation = async (payload: any) => {
	Logger.info('Inside Pre Verification Approval validator')

	const Schema = Joi.object({
		projectId: Joi.number().required(),
		short_description: Joi.string().allow().required(),
		exact_address: Joi.string().allow(null).optional(),
		video: Joi.string().allow(null).optional(),
		project_size: Joi.number().allow().required(),
		man_power: Joi.number().allow(null).optional(),
		farm_type: Joi.string().allow(null).optional(),
		approach: Joi.string().allow().required(),
		key_activities: Joi.string().allow().required(),
		sdg_commitments: Joi.array().items(Joi.string()).allow().required(),
		impact_areas: Joi.array().items(Joi.string()).allow().required(),
		area_offset_generation: Joi.number().allow().required(),
		min_annual_sequestration: Joi.number().allow().required(),
		max_annual_sequestration: Joi.number().allow().required(),
		per_year_annual_sequestration: Joi.number().allow().required(),
		total_credits_over_project: Joi.number().allow().required(),
		certification_date: Joi.string().allow().required(),
		additional_certification: Joi.string().allow().required(),
		registry_project_id: Joi.string().allow().required(),
		large_description: Joi.string().allow().required(),
		year_of_projection: Joi.string().allow(),
		projection: Joi.string().allow().required(),
		additional_note: Joi.string().allow(null).optional(),
		additional_documents: Joi.array().items(Joi.string()).allow(),
		typeOfReview: Joi.string().allow().required(),
		platform_fees: Joi.string().allow().required(),
		pre_verification_cost: Joi.string().allow().required(),
		vvb_fees: Joi.string().allow().required(),
	})

	const validate = Schema.validate(payload)
	let error = false
	let message = 'Success Validation'

	if (validate.error) {
		message = validate.error.details[0].message
		message = message.replace(/"/g, '')
		error = true
	}

	return { error, message }
}

export const preVerificationSuccessValidation = async (payload: any) => {
	Logger.info('Inside Pre Verification Success validator')

	const Schema = Joi.object({
		projectId: Joi.number().required(),
		preVerificationDoc: Joi.array().items(Joi.string()).allow().required(),
		live_seed_project: Joi.boolean().allow().required(),
		hold_for_full_verification: Joi.boolean().allow().required(),
	})

	const validate = Schema.validate(payload)
	let error = false
	let message = 'Success Validation'

	if (validate.error) {
		message = validate.error.details[0].message
		message = message.replace(/"/g, '')
		error = true
	}

	return { error, message }
}

export const liveSeedProjectValidation = async (payload: any) => {
	Logger.info('Inside Live Seed Project validator')

	const Schema = Joi.object({
		projectId: Joi.number().required(),
		live_seed_project: Joi.boolean().allow().required(),
		hold_for_full_verification: Joi.boolean().allow().required(),
		project_seed_start_date: Joi.date().allow().required(),
		project_seed_end_date: Joi.date().allow().required(),
	})

	const validate = Schema.validate(payload)
	let error = false
	let message = 'Success Validation'

	if (validate.error) {
		message = validate.error.details[0].message
		message = message.replace(/"/g, '')
		error = true
	}

	return { error, message }
}

export const fullVerificationSuccessValidation = async (payload: any) => {
	Logger.info('Inside Pre Verification Success validator')

	const Schema = Joi.object({
		projectId: Joi.number().required(),
		fullVerificationDoc: Joi.array().items(Joi.string()).allow().required(),
		live_seed_project: Joi.boolean().allow().required(),
	})

	const validate = Schema.validate(payload)
	let error = false
	let message = 'Success Validation'

	if (validate.error) {
		message = validate.error.details[0].message
		message = message.replace(/"/g, '')
		error = true
	}

	return { error, message }
}

export const createWithdrawRequestValidation = async (payload: any) => {
	Logger.info('Inside Create Withdraw Request validator')
	const Schema = Joi.object({
		amount: Joi.number().required(),
		withdrawDocs: Joi.array().items(Joi.string()).allow().required(),
		withdrawReason: Joi.string().allow().required(),
		projectId: Joi.number().allow().required(),
		userId: Joi.string().allow().required(),
	})

	const validate = Schema.validate(payload)
	let error = false
	let message = 'Success Validation'

	if (validate.error) {
		message = validate.error.details[0].message
		message = message.replace(/"/g, '')
		error = true
	}

	return { error, message }
}

export const addSeedVccCreditsValidation = async (payload: any) => {
	Logger.info('Inside add Seed Credits  validator')
	const Schema = Joi.object({
		projectId: Joi.number().required(),
		serialNumber: Joi.string().required(),
		quantityIssued: Joi.number().required(),
		additionalCertificates: Joi.array().items(Joi.string()).allow(),
	})

	const validate = Schema.validate(payload)
	let error = false
	let message = 'Success Validation'
	if (validate.error) {
		message = validate.error.details[0].message
		message = message.replace(/"/g, '')
		error = true
	}

	return { error, message }
}

export const updateVvbRegistryLogoValidator = async (payload: any) => {
	Logger.info('Inside update Vvb Registry Logo Validator')
	const Schema = Joi.object({
		option: Joi.string().required().valid('registry', 'vvb_name'),
		logo: Joi.string().required(),
		name: Joi.string().required(),
	})

	const validate = Schema.validate(payload)
	let error = false
	let message = 'Success Validation'
	if (validate.error) {
		message = validate.error.details[0].message
		message = message.replace(/"/g, '')
		error = true
	}

	return { error, message }
}
