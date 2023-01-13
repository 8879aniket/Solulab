import { AdminInterface } from '@interfaces/admin'
import { Request, Response } from 'express'
import { v4 as uuid } from 'uuid'
import { Logger } from '@config/logger'
import { errorHandler, responseHandler } from '@helpers/responseHandlers'
import User from '@dummy/admin/admin.model'
import { createAdminService, getAdminService, updateAdminService } from '@dummy/admin/service'
import Messages from '@helpers/messages'
import { UserInterface } from '@interfaces/user'
import { createUser, updateUserService } from '@dummy/user/service'

export const createAdmin = async (req: Request, res: Response) => {
	Logger.info('Inside Create Admiin Controller')
	try {
		const {
			id,
			name,
			email,
			mobileNumber,
			countryCode,
			password,
			twoFAStatus,
			twoFAType,
			otpCode,
			accountType,
			role,
			firstTimeLogin,
			isActive,
			profilePic,
		} = req.body

		const adminObject: AdminInterface = {
			id,
			name,
			email,
			mobileNumber,
			countryCode,
			password,
			twoFAStatus,
			twoFAType,
			otpCode,
			accountType,
			role,
			firstTimeLogin,
			isActive,
			profilePic,
		}
		const admin = await createAdminService(adminObject)
		if (!admin)
			return errorHandler({
				res,
				statusCode: 500,
				err: Messages.ADMIN_CREATE_FAILED,
			})
		if (adminObject.accountType === 'SUPER_ADMIN') {
			const userObj: any = {
				id: adminObject.id,
				name: adminObject.name,
				email: adminObject.email,
				countryCode: adminObject.countryCode,
				mobileNumber: adminObject.mobileNumber!,
				password: adminObject.password,
				twoFAStatus: adminObject.twoFAStatus,
				twoFAType: adminObject.twoFAType,
				otpCode: adminObject.otpCode,
				accountType: adminObject.accountType,
			}
			const userData = await createUser(userObj)
		}
		return responseHandler({ res, status: 201, msg: Messages.ADMIN_CREATED_SUCCESS })
	} catch (err) {
		Logger.error(err)
	}
}

export const updateAdmin = async (req: Request, res: Response) => {
	Logger.info('Inside update admin controller')
	try {
		const payload = req.body
		console.log(payload)
		const { userId } = req.params
		const adminData = await updateAdminService(payload, userId)
		if (adminData === null) {
			return errorHandler({
				res,
				statusCode: 500,
				err: Messages.ADMIN_UPDATE_FAILED,
			})
		}
		if (payload.accountType === 'SUPER_ADMIN') {
			await updateUserService(payload, userId)
		}
		return responseHandler({ res, status: 201, msg: Messages.ADMIN_UPDATE_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, statusCode: 401, data: { error } })
	}
}
