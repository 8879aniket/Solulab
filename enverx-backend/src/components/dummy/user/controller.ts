import { Request, Response } from 'express'
import { Logger } from '@config/logger'
import { errorHandler, responseHandler } from '@helpers/responseHandlers'
import { createUser, createBankAccount, updateUserService } from '@dummy/user/service'
import Messages from '@helpers/messages'
import { UserInterface } from '@interfaces/user'

export const createUserApi = async (req: Request, res: Response) => {
	Logger.info('Inside user register controller')
	try {
		const {
			id,
			userType,
			email,
			companyName,
			companyRegistrationNumber,
			companyWebsite,
			country,
			state,
			postalCode,
			password,
			mobileNumber,
			countryCode,
			accountType,
			entityType,
			name,
			DOB,
		} = req.body
		const userObject: UserInterface = {
			id,
			companyName,
			companyRegistrationNumber,
			companyWebsite,
			country,
			state,
			postalCode,
			email,
			countryCode,
			mobileNumber,
			password,
			userType,
			accountType,
			entityType,
			name,
			DOB,
		}

		const user = await createUser(userObject)

		if (!user)
			return errorHandler({
				res,
				statusCode: 500,
				err: Messages.USER_CREATE_FAILED,
				data: { user },
			})
		return responseHandler({ res, status: 201, msg: Messages.USER_CREATE_SUCCESS })
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, statusCode: 400, data: { error } })
	}
}

export const updateUserApi = async (req: Request, res: Response) => {
	Logger.info('Inside update User controller')
	try {
		const payload = req.body
		const { userId } = req.params
		const userData = await updateUserService(payload, userId)
		if (userData === null) {
			return errorHandler({
				res,
				statusCode: 500,
				err: Messages.USER_UPDATE_FAILED,
			})
		}
		return responseHandler({ res, status: 201, msg: Messages.USER_UPDATE_SUCCESS })
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, statusCode: 400, data: { error } })
	}
}

export const createDummyBankAccount = async (req: Request, res: Response) => {
	Logger.info('Inside dummy create banck account controller')
	try {
		const {
			id,
			account_number,
			routing_number,
			IBAN,
			account_id,
			status,
			description,
			tracking_ref: trackingRef,
			fingerprint,
			billing_name,
			billing_city,
			billing_country,
			billing_line1,
			billing_line2,
			billing_district,
			billing_postalCode,
			bank_name,
			bank_city,
			bank_country,
			bank_line1,
			bank_line2,
			bank_district,
			userId,
			type_of_account,
		} = req.body
		const payload = {
			id,
			account_number,
			routing_number,
			IBAN,
			account_id,
			status,
			description,
			tracking_ref: trackingRef,
			fingerprint,
			billing_name,
			billing_city,
			billing_country,
			billing_line1,
			billing_line2,
			billing_district,
			billing_postalCode,
			bank_name,
			bank_city,
			bank_country,
			bank_line1,
			bank_line2,
			bank_district,
			userId,
			type_of_account,
		}
		const bankData = await createBankAccount(payload)

		if (!bankData) return errorHandler({ res, err: Messages.BANK_ACCOUNT_CREATION_FAILED })
		return responseHandler({
			res,
			status: 201,
			msg: Messages.BANK_ACCOUNT_CREATED_SUCCESS,
			data: bankData,
		})
	} catch (err) {}
}
