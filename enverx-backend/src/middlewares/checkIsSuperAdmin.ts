import { Logger } from '@config/logger'
import messages from '@helpers/messages'
import { errorHandler } from '@helpers/responseHandlers'
import { NextFunction, Request, Response } from 'express'

export default async (req: Request, res: Response, next: NextFunction) => {
	Logger.info('Inside check isAdmin Authorize middleware')
	try {
		const { accountType } = req.user
		if (accountType === 'USER' || accountType === 'ADMIN') {
			return errorHandler({ res, statusCode: 401, err: messages.UNAUTHORIZE })
		}
		next()
	} catch (error) {
		Logger.error(req.user)
		Logger.error(error)
	}
}
