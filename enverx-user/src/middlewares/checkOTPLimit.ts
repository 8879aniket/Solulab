import { Logger } from '@config/logger'
import messages from '@helpers/messages'
import { errorHandler } from '@helpers/responseHandlers'
import { getUserService } from '@user/service'
import { NextFunction, Request, Response } from 'express'
import moment from 'moment'
export default async (req: Request, res: Response, next: NextFunction) => {
	Logger.info('Inside check otp limit middleware')
	try {
		const { email } = req.body
		const user = await getUserService({ email })

		if (req.url.toString() === '/forgotPassword') {
			if (user === null) {
				return errorHandler({
					res,
					err: messages.FORGOT_PASSWORD_EMAIL_NOT_FOUND,
					statusCode: 502,
				})
			}
			if (user.isBlocked) {
				return errorHandler({
					res,
					err: messages.USER_BLOCKED,
					statusCode: 502,
				})
			}
			if (user.otpBlockTime !== null) {
				if (moment(new Date().toUTCString()).isSameOrAfter(user?.otpBlockTime!.toUTCString())) {
					user.otpLimit = 5
					user.isOTPBlocked = false
					user.otpBlockTime = new Date()
					await user.save()
				}
			}

			if (user.loginBlockedTime !== null) {
				if (moment(new Date().toUTCString()).isSameOrAfter(user?.loginBlockedTime!.toUTCString())) {
					user.loginAttempt = 5
					user.isLoginBlocked = false
					user.loginBlockedTime = new Date()
					await user.save()
				}
			}

			if (user?.isLoginBlocked) {
				if (moment(user?.loginBlockedTime!.toUTCString()).isSameOrAfter(new Date().toUTCString())) {
					return errorHandler({
						res,
						statusCode: 501,
						err: messages.USER_LOGIN_BLOCKED,
						data: {
							userBlockTime: user?.loginBlockedTime,
						},
					})
				}
			}

			if (user?.isOTPBlocked) {
				if (moment(user?.otpBlockTime!.toUTCString()).isSameOrAfter(new Date().toUTCString())) {
					return errorHandler({
						res,
						statusCode: 501,
						err: messages.USER_LOGIN_BLOCKED,
						data: {
							userBlockTime: user?.otpBlockTime,
						},
					})
				}
			}

			if (user.forgotPasswordBlockTime !== null) {
				if (
					moment(new Date().toUTCString()).isSameOrAfter(
						user?.forgotPasswordBlockTime!.toUTCString()
					)
				) {
					user.forgotPasswordLimit = 3
					user.linkSentBlocked = false
					await user.save()
				}
			}
			if (user?.forgotPasswordLimit! < 0) {
				if (user?.linkSentBlocked) {
					if (
						moment(new Date().toUTCString()).isSameOrAfter(
							user?.forgotPasswordBlockTime!.toUTCString()
						)
					) {
						if (user.passwordResetExpired !== null) {
							if (
								moment(new Date().toUTCString()).isSameOrBefore(
									user?.passwordResetExpired!.toUTCString()
								)
							) {
								return errorHandler({
									res,
									statusCode: 503,
									err: messages.RESET_PASSWORD_LINK_ALREADY_SENT,
									data: {
										linkBlockTime: user?.passwordResetExpired,
									},
								})
							}
						}

						user.forgotPasswordLimit = 3
						user.forgotPasswordBlockTime = new Date()
						user.linkSentBlocked = false
						await user.save()
						return next()
					}
					return errorHandler({
						res,
						statusCode: 501,
						err: messages.FORGOT_PASSWORD_SENT_LINK_BLOCKED,
						data: { forgotPasswordBlockTime: user?.forgotPasswordBlockTime },
					})
				}
			} else {
				if (user?.forgotPasswordLimit! === 0) {
					user?.decrement('forgotPasswordLimit')
					user!.linkSentBlocked = true
					await user?.save()
					return errorHandler({
						res,
						statusCode: 501,
						err: messages.FORGOT_PASSWORD_SENT_LINK_BLOCKED,
						data: { forgotPasswordBlockTime: user?.forgotPasswordBlockTime },
					})
				}

				if (user.passwordResetExpired !== null) {
					if (
						moment(new Date().toUTCString()).isSameOrBefore(
							user?.passwordResetExpired!.toUTCString()
						)
					) {
						return errorHandler({
							res,
							statusCode: 503,
							err: messages.RESET_PASSWORD_LINK_ALREADY_SENT,
							data: {
								linkBlockTime: user?.passwordResetExpired,
							},
						})
					}
				}

				user!.forgotPasswordBlockTime! = new Date(new Date().setDate(new Date().getDate() + 1))
				await user?.save()
				return next()
			}
		}

		if (user === null) {
			return errorHandler({
				res,
				err: messages.EMAIL_NOT_REGISTERED,
				statusCode: 502,
			})
		}
		if (user.isBlocked) {
			return errorHandler({
				res,
				err: messages.USER_BLOCKED,
				statusCode: 502,
			})
		}
		if (user.otpBlockTime !== null) {
			if (moment(new Date().toUTCString()).isSameOrAfter(user?.otpBlockTime!.toUTCString())) {
				user.otpLimit = 5
				user.isOTPBlocked = false
				user.otpBlockTime = new Date()
				await user.save()
			}
		}

		if (user.loginBlockedTime !== null) {
			if (moment(new Date().toUTCString()).isSameOrAfter(user?.loginBlockedTime!.toUTCString())) {
				user.loginAttempt = 5
				user.isLoginBlocked = false
				user.loginBlockedTime = new Date()
				await user.save()
			}
		}

		if (req.url.toString() === '/updateMobile') {
			if (user.mobileOtpBlockTime !== null) {
				if (
					moment(new Date().toUTCString()).isSameOrAfter(user?.mobileOtpBlockTime!.toUTCString())
				) {
					user.otpMobileLimit = 5
					user.mobileOtpBlocked = false
					await user.save()
				}
			}
			if (user?.otpMobileLimit! < 0) {
				if (user?.mobileOtpBlocked) {
					if (
						moment(new Date().toUTCString()).isSameOrAfter(user?.mobileOtpBlockTime!.toUTCString())
					) {
						user.otpMobileLimit = 5
						user.mobileOtpBlockTime = new Date()
						user.mobileOtpBlocked = false
						await user.save()
						return next()
					}
					return errorHandler({
						res,
						statusCode: 501,
						err: messages.MOBILE_OTP_SENT_BLOCKED,
						data: { mobileOtpBlockTime: user?.mobileOtpBlockTime },
					})
				}
			} else {
				if (user?.otpMobileLimit! === 0) {
					user?.decrement('otpMobileLimit')
					user!.mobileOtpBlocked = true
					await user?.save()
					return errorHandler({
						res,
						statusCode: 501,
						err: messages.MOBILE_OTP_SENT_BLOCKED,
						data: { mobileOtpBlockTime: user?.mobileOtpBlockTime },
					})
				}

				user!.mobileOtpBlockTime! = new Date(new Date().setDate(new Date().getDate() + 1))
				await user?.save()
				return next()
			}
		}

		if (req.url.toString() === '/login') {
			if (user?.otpLimit! < 0) {
				if (user?.isOTPBlocked) {
					if (moment(new Date().toUTCString()).isSameOrBefore(user?.otpBlockTime!.toUTCString())) {
						return errorHandler({
							res,
							statusCode: 501,
							err: messages.OTP_LIMIT_REACHED,
							data: { otpBlockTime: user?.otpBlockTime },
						})
					} else {
						user.otpLimit = 5
						user.isOTPBlocked = false
						await user.save()
					}
				}
			} else {
				if (user?.otpLimit! === 0) {
					user?.decrement('otpLimit')
					user!.isOTPBlocked = true
					await user?.save()
					return errorHandler({
						res,
						statusCode: 501,
						err: messages.OTP_LIMIT_REACHED,
						data: { otpBlockTime: user?.otpBlockTime },
					})
				}

				user!.otpBlockTime! = new Date(new Date().setDate(new Date().getDate() + 1))
				await user?.save()
			}

			if (user?.loginAttempt! < 0) {
				if (user?.isLoginBlocked) {
					if (
						moment(user?.loginBlockedTime!.toUTCString()).isSameOrAfter(new Date().toUTCString())
					) {
						return errorHandler({
							res,
							statusCode: 501,
							err: messages.USER_LOGIN_BLOCKED,
							data: {
								loginBlockedTime: user.loginBlockedTime,
							},
						})
					} else {
						user.loginAttempt = 5
						user.isLoginBlocked = false
						user.loginBlockedTime = new Date()
						await user.save()
						return next()
					}
				}
			} else {
				if (user?.loginAttempt! === 0) {
					user?.decrement('loginAttempt')
					user!.isLoginBlocked = true
					await user?.save()
					return errorHandler({
						res,
						statusCode: 501,
						err: messages.USER_LOGIN_BLOCKED,
						data: {
							loginBlockedTime: user.loginBlockedTime,
						},
					})
				}
				user!.loginBlockedTime! = new Date(new Date().setDate(new Date().getDate() + 1))
				await user?.save()
				return next()
			}
		}

		if (user?.isLoginBlocked) {
			if (moment(user?.loginBlockedTime!.toUTCString()).isSameOrAfter(new Date().toUTCString())) {
				return errorHandler({
					res,
					statusCode: 501,
					err: messages.USER_LOGIN_BLOCKED,
					data: {
						userBlockTime: user?.loginBlockedTime,
					},
				})
			}
		}

		if (user?.otpLimit! < 0) {
			if (user?.isOTPBlocked) {
				if (moment(new Date().toUTCString()).isSameOrAfter(user?.otpBlockTime!.toUTCString())) {
					user.otpLimit = 5
					user.isOTPBlocked = false
					await user.save()
					return next()
				}
				return errorHandler({
					res,
					statusCode: 501,
					err: messages.OTP_LIMIT_REACHED,
					data: { otpBlockTime: user?.otpBlockTime },
				})
			}
		} else {
			if (user?.otpLimit! === 0) {
				user?.decrement('otpLimit')
				user!.isOTPBlocked = true
				await user?.save()
				return errorHandler({
					res,
					statusCode: 501,
					err: messages.OTP_LIMIT_REACHED,
					data: { otpBlockTime: user?.otpBlockTime },
				})
			}
			user!.otpBlockTime! = new Date(new Date().setDate(new Date().getDate() + 1))
			await user?.save()
			return next()
		}
	} catch (error) {
		Logger.error(error)
		return next(error)
	}
}
