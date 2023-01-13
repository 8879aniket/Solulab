import { Logger } from '@config/logger'
import messages from '@helpers/messages'
import { errorHandler } from '@helpers/responseHandlers'
import { NextFunction, Request, Response } from 'express'

export const restrictToInvester = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { accountType, userType } = req.user
		if (accountType !== 'USER' || userType === 'PROJECT_DEVELOPER') {
			return errorHandler({ res, statusCode: 401, err: messages.UNAUTHORIZE })
		}
		return next()
	} catch (error) {
		Logger.error(req.user)
		Logger.error(error)
	}
}

export const restrictToDeveloper = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { accountType, userType } = req.user
		if (userType === 'INVESTOR') {
			return errorHandler({ res, statusCode: 401, err: messages.UNAUTHORIZE })
		}
		return next()
	} catch (error) {
		Logger.error(req.user)
		Logger.error(error)
	}
}
