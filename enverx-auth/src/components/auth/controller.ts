import { Request, Response } from 'express'
import { Logger } from '@config/logger'
import { errorHandler, responseHandler } from '@helpers/responseHandlers'
import { generateToken, verifyToken } from '@helpers/jwt'
import Messages from '@helpers/messages'
import { UserInterface } from '@interfaces/user'

export const generateTokenRequest = async (req: Request, res: Response, next: any) => {
	Logger.info('Inside generate Token controller')
	try {
		let token: string = ''
		const rememberMe: boolean = req.body.rememberMe || false
		const response: UserInterface = {
			id: req.body.id,
			name: req.body.name,
			email: req.body.email,
			accountType: req.body.accountType,
			userType: req.body.userType,
		}
		token = (await generateToken(response, rememberMe))!
		return responseHandler({ res, data: { token }, msg: Messages.LOGIN_SUCCESS })
	} catch (err) {
		Logger.error(err)
		return errorHandler({ res, statusCode: 400, data: { err } })
	}
}

export const verifyTokenRequest = async (req: Request, res: Response, next: any) => {
	Logger.info('Inside Verify Token controller')
	try {
		const token = req.headers.authorization?.split(' ')[1]!

		const result = await verifyToken(token)
		if (result.error) {
			return errorHandler({
				res,
				err: result.error,
				statusCode: 510,
			})
		}
		return responseHandler({ res, data: result, msg: Messages.AUTHORIZED_PASSED })
	} catch (err) {
		Logger.error(err)
		return errorHandler({ res, statusCode: 400, data: { err } })
	}
}
