import axios from 'axios'

import Config from '@config/config'
import { Logger } from '@config/logger'
import messages from '@helpers/messages'
import { errorHandler } from '@helpers/responseHandlers'
import { NextFunction, Request, Response } from 'express'
import { getUserService } from '@user/service'

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

		if (user.accountType === 'ADMIN' || user.accountType === 'SUPER_ADMIN') {
			req.user = user
			return next()
		}
		const checkUser = await getUserService({ id: user.id })

		if (!checkUser)
			return errorHandler({
				res,
				err: messages.USER_DELETED,
				statusCode: 510,
			})

		if (new Date(result.data?.data.iat * 1000) < checkUser.lastLogout)
			return errorHandler({
				res,
				err: messages.JWT_TOKEN_EXPIRED,
				statusCode: 510,
			})

		req.user = user
		return next()
	} catch (error: any) {
		Logger.error(error)
		return errorHandler({
			res,
			err: messages.SOMETHING_WENT_WRONG,
			data: { errorMessage: error.response.data },
			statusCode: 510,
		})
	}
}

export default authorize
