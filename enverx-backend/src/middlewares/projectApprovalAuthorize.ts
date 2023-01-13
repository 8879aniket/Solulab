import { Logger } from '@config/logger'
import messages from '@helpers/messages'
import { errorHandler } from '@helpers/responseHandlers'
import { NextFunction, Request, Response } from 'express'

export default async (req: Request, res: Response, next: NextFunction) => {
	Logger.info('Inside Project Approval Authorize middleware')
	try {
		const { option } = req.body
		const { accountType, userType } = req.user

		if (option !== 'submitProject') {
			if (userType === 'PROJECT_DEVELOPER') {
				next()
			} else {
				errorHandler({ res, err: messages.UNAUTHORIZE })
			}
		} else {
			if (accountType !== 'USER') {
				errorHandler({ res, err: messages.UNAUTHORIZE })
			} else {
				next()
			}
		}
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}
