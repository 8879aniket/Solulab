import axios from 'axios'

import Config from '@config/config'
import { Logger } from '@config/logger'
import messages from '@helpers/messages'
import { errorHandler } from '@helpers/responseHandlers'
import { NextFunction, Request, Response } from 'express'

const authorize = async (req: Request, res: Response, next: NextFunction) => {
	Logger.info('Authorize URL')
	try {
		if (!req.headers?.authorization) {
			return errorHandler({
				res,
				statusCode: 401,
				err: messages.TOKEN_NOT_PROVIDED,
			})
		}

		const result: any = await axios.get(Config.AUTH.VERIFY_TOKEN, {
			headers: {
				authorization: req.headers.authorization,
			},
		})

		const user = result.data?.data
		req.user = user
		return next()
	} catch (error: any) {
		Logger.error(error)
		return errorHandler({
			res,
			err: messages.SOMETHING_WENT_WRONG,
			data: { errorMessage: error.response.data },
			statusCode: 502,
		})
	}
}

export default authorize
