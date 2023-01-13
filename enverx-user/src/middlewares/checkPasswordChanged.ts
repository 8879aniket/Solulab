import { Logger } from '@config/logger'
import messages from '@helpers/messages'
import { errorHandler } from '@helpers/responseHandlers'
import { NextFunction, Request, Response } from 'express'
import { getUserService } from '@user/service'
import moment from 'moment'

const checkPasswordChanged = async (req: Request, res: Response, next: NextFunction) => {
	Logger.info('inside check password changed middleware')
	try {
		const user = await getUserService({ email: req.user.email })
		if (user === null) {
			return errorHandler({
				res,
				err: messages.EMAIL_NOT_REGISTERED,
				statusCode: 502,
			})
		}
		const tokenCreatedAt = req.user.iat * 1000
		if (user.passwordChangedAt !== null) {
			if (
				moment(user.passwordChangedAt.toUTCString()).isSameOrAfter(
					new Date(tokenCreatedAt).toUTCString()
				)
			) {
				if (
					user.passwordChangeByUserTokenCreatedAt !== null &&
					moment(user.passwordChangeByUserTokenCreatedAt.toUTCString()).isSame(
						new Date(tokenCreatedAt).toUTCString()
					)
				) {
					return next()
				}
				return errorHandler({
					res,
					err: messages.SOMETHING_WENT_WRONG,
					data: {
						errorMessage: {
							result: false,
							msg: messages.JWT_TOKEN_EXPIRED,
							data: {},
						},
					},
					statusCode: 510,
				})
			}
		}
		return next()
	} catch (error: any) {
		Logger.error(error)
		return next(error)
	}
}

export default checkPasswordChanged
