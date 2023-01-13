import { Logger } from '@config/logger'
import { sendNotification } from '@helpers/fcm'
import Messages from '@helpers/messages'
import { errorHandler, responseHandler } from '@helpers/responseHandlers'
import { Response, Request } from 'express'
import { getNotificationService } from './service'

export const getNotification = async (req: Request, res: Response) => {
	Logger.info('Inside get notification controller')
	try {
		const userId = req.user.id
		const data = await getNotificationService({ userId })
		if (data === null) {
			return errorHandler({ res, statusCode: 502, err: Messages.GET_NOTIFICATION_FAILED })
		}
		return responseHandler({ res, status: 200, data, msg: Messages.GET_NOTIFICATION_SUCCESS })
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, statusCode: 400, data: { error } })
	}
}
