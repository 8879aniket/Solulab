import { Logger } from '@config/logger'
import messages from '@helpers/messages'
import { errorHandler } from '@helpers/responseHandlers'
import { NextFunction, Request, Response } from 'express'

export default async (req: Request, res: Response, next: NextFunction) => {
	try {
		Logger.info('Inside check isAdmin Authorize middleware')
		const { accountType } = req.user
		if (accountType === 'USER') {
			return errorHandler({ res, statusCode: 401, err: messages.UNAUTHORIZE })
		}
		next()
	} catch (err) {
		Logger.error(err)
		return errorHandler({ res, statusCode: 500, err: messages.INTERNAL_SERVER_ERROR })
	}
}
