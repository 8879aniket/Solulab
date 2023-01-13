import { v4 as uuid } from 'uuid'
import { UserInterface, BankDetailsInterfacte } from '@interfaces/user'
import { Request, Response } from 'express'
import { Logger } from '@config/logger'
import {
	loginValidation,
	registerRequest,
	verifyLoginValidation,
	emailValidation,
	forgotPasswordValidation,
	mobileOtpValidation,
	resetPasswordRequest,
	updateUserValidation,
	registerIndividualRequest,
	updateEchoUserValidation,
	changePasswordValidation,
	createEchoUserValidation,
	priceLastUpdatedValidation,
	createNewUserValidator,
	twoFAUpdateRequestValidation,
	securityUpdateRequestValidation,
	newUserloginRequestValidate,
	sendEmailValidation,
	userVerifyLoginValisdation,
	updateUserKYBValidator,
} from '@user/validator'
import { errorHandler, responseHandler } from '@helpers/responseHandlers'
import { hash } from 'bcrypt'
import {
	createUser,
	generateOTP,
	getUserService,
	verifyPassword,
	resetPasswordService,
	updateUserService,
	createBankAccountService,
	getBankAccountService,
	addWalletId,
	updateBankAcccountService,
	updateACHBankAcccountService,
	updateOTPService,
	deleteBankAcccountService,
	getAllUserService,
	saveUserOTP,
	createPasswordResetToken,
	getBankAccountByIdService,
	getBlockchainDetailsService,
	getEchoUsersService,
	updateEchoUserService,
	getEchoUserService,
	getEchoSubscriberCountService,
	checkPassword,
	createPasswordService,
	createEchoUserService,
	createNewUserService,
	GenerateRandomStringOfLength,
	caxtonUserLoginService,
	caxtonUserOnboardService,
} from '@user/service'
import Messages from '@helpers/messages'
import { sendEmail } from '@helpers/email'
import { sendSMS } from '@helpers/sms'
import axios from 'axios'
import Config from '@config/config'
import { subscribeTopic, unSubscribeTopic } from '@notification/service'
import { sendNotification, unsubscribeFromTopic } from '@helpers/fcm'
import { authenticatorGenerator, validateAuthCode } from '@helpers/authenticator'
import moment from 'moment'
import { caxtonOnboardInterface, kybPayloadInterface } from '@interfaces/caxton'
import { encryptCaxtonPassword } from '@helpers/encryptionHelper'

export const createUserApi = async (req: Request, res: Response) => {
	Logger.info('Inside user register controller')
	try {
		const {
			entityType,
		}: {
			entityType: string
		} = req.body
		const { oldEmail } = req.query
		const old_email = oldEmail ? oldEmail.toString() : ''
		switch (entityType) {
			case 'COMPANY': {
				const {
					email,
					password,
					companyName,
					companyRegistrationNumber,
					companyWebsite,
					country,
					state,
					postalCode,
					mobileNumber,
					countryCode,
					userType,
				}: {
					email: string
					password: string
					companyName: string
					companyRegistrationNumber: string
					companyWebsite: string
					country: string
					state: string
					postalCode: number
					mobileNumber: number
					countryCode: string
					userType: string
				} = req.body

				const userObject: UserInterface = {
					id: uuid(),
					companyName,
					companyRegistrationNumber,
					companyWebsite,
					country,
					state,
					postalCode,
					email,
					countryCode,
					mobileNumber,
					password,
					userType: userType === 'INVESTOR' ? 'INVESTOR' : 'PROJECT_DEVELOPER',
					entityType: 'COMPANY',
				}

				const validator = await registerRequest(userObject)

				if (validator.error) {
					return errorHandler({ res, err: validator.message })
				}

				userObject.password = await hash(password, 10)

				const otp = Math.floor(100000 + Math.random() * 900000)
				userObject.otpCode = otp
				userObject.isRegistered = true

				const user = await createUser(userObject, old_email)

				if (user === false) {
					return errorHandler({
						res,
						statusCode: 409,
						err: Messages.EMAIL_EXIST,
					})
				} else if (user === null) {
					return errorHandler({
						res,
						statusCode: 409,
						err: Messages.OLD_EMAIL_NOT_REGISTERED,
					})
				}

				const emailPayload = {
					data: otp.toString(),
					email,
				}
				await saveUserOTP(user.mobileNumber, user.countryCode!, user.email, otp)
				const emailSent = await sendEmail(emailPayload, 'sendVerification')

				if (emailSent?.error)
					return errorHandler({
						res,
						statusCode: 400,
						err: Messages.OTP_SENT_EMAIL_FAILED,
						data: emailSent?.error,
					})

				return responseHandler({ res, status: 201, msg: Messages.OTP_SENT_EMAIL, data: { user } })
			}

			case 'INDIVIDUAL': {
				const {
					email,
					password,
					name,
					country,
					mobileNumber,
					countryCode,
					userType,
					DOB,
				}: {
					email: string
					password: string
					name: string
					country: string
					mobileNumber: number
					countryCode: string
					userType: string
					DOB: Date
				} = req.body

				const userObject: UserInterface = {
					id: uuid(),
					name,
					country,
					email,
					countryCode,
					mobileNumber,
					password,
					userType: userType === 'INVESTOR' ? 'INVESTOR' : 'PROJECT_DEVELOPER',
					entityType: 'INDIVIDUAL',
					DOB,
				}

				const validator = await registerIndividualRequest(userObject)

				if (validator.error) {
					return errorHandler({ res, err: validator.message })
				}

				userObject.password = await hash(password, 10)

				const otp = Math.floor(100000 + Math.random() * 900000)
				userObject.otpCode = otp

				userObject.isRegistered = true
				const user = await createUser(userObject, old_email)

				if (user === false) {
					return errorHandler({
						res,
						statusCode: 409,
						err: Messages.EMAIL_EXIST,
					})
				} else if (user === null) {
					return errorHandler({
						res,
						statusCode: 409,
						err: Messages.OLD_EMAIL_NOT_REGISTERED,
					})
				}
				const emailPayload = {
					data: otp.toString(),
					email,
				}

				await saveUserOTP(user.mobileNumber, user.countryCode!, user.email, otp)
				const emailSent = await sendEmail(emailPayload, 'sendVerification')

				if (emailSent?.error)
					return errorHandler({
						res,
						statusCode: 400,
						err: Messages.OTP_SENT_EMAIL_FAILED,
						data: emailSent?.error,
					})

				return responseHandler({ res, status: 201, msg: Messages.OTP_SENT_EMAIL, data: { user } })
			}
			default: {
				return errorHandler({
					res,
					statusCode: 406,
					err: Messages.WRONG_INPUT_PROVIDED,
				})
			}
		}
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, statusCode: 400, data: { error } })
	}
}

export const login = async (req: Request, res: Response) => {
	try {
		Logger.info('Inside Login controller')
		const data: { email: string; password: string } = req.body

		const { error, message } = await loginValidation(data)
		if (error) {
			return errorHandler({ res, statusCode: 501, err: message })
		}

		const user = await getUserService({ email: data.email })
		if (user === null) {
			return errorHandler({
				res,
				err: Messages.USER_NOT_FOUND,
				statusCode: 502,
			})
		}
		const resData: any = {
			mobileNumber: user.mobileNumber,
			countryCode: user.countryCode,
			email: user.email,
			loginAttempt: user.loginAttempt,
			loginBlockedTime: user.loginBlockedTime,
			otplimit: user.otpLimit,
			otpBlockTime: user.otpBlockTime,
			isOTPBlocked: user.isOTPBlocked,
			isLoginBlocked: user.isLoginBlocked,
		}
		const correctUser = await verifyPassword(data.password, user.password)

		if (!correctUser) {
			user!.decrement('loginAttempt')
			resData.loginAttempt -= 1
			await user.save()
			return errorHandler({
				res,
				err: Messages.INCORRECT_PASSWORD,
				statusCode: 502,
				data: resData,
			})
		}

		if (user!.userType === 'INVESTOR' || 'PROJECT_DEVELOPER') {
			// 2FA code
			const otp = Math.floor(100000 + Math.random() * 900000)

			const emailPayload = {
				data: otp.toString(),
				email: user!.email,
			}

			const emailSent = await sendEmail(emailPayload, 'sendVerification')

			if (emailSent?.error) {
				resData.error = emailSent?.error
				return errorHandler({
					res,
					statusCode: 400,
					err: Messages.OTP_SENT_EMAIL_FAILED,
					data: resData,
				})
			}

			await saveUserOTP(user.mobileNumber, user.countryCode, user.email, otp)
			resData.otplimit -= 1
			return responseHandler({ res, status: 200, msg: Messages.OTP_SENT_EMAIL, data: resData })
		} else {
			return errorHandler({
				res,
				err: Messages.ACCOUNT_TYPE_ERROR,
				statusCode: 502,
			})
		}
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, statusCode: 400, data: { error } })
	}
}

export const verifyLogin = async (req: Request, res: Response) => {
	try {
		Logger.info('Inside Verify login controller')
		const {
			countryCode,
			mobileNumber,
			otpCode,
			email,
			fcmToken,
		}: {
			countryCode: string
			mobileNumber: number
			otpCode: number
			email: string
			fcmToken: string
		} = req.body

		const { error, message } = await verifyLoginValidation({
			countryCode,
			mobileNumber,
			otp: otpCode,
			email,
			fcmToken,
		})

		if (error) {
			return errorHandler({ res, statusCode: 501, err: message })
		}
		const user = await getUserService({ email })
		if (user === null) {
			return errorHandler({
				res,
				err: Messages.USER_NOT_FOUND,
				statusCode: 502,
			})
		}

		if (user.incorrectOtpAttempt === 0) {
			return errorHandler({
				res,
				err: Messages.OTP_EXPIRED,
				statusCode: 502,
			})
		}

		if (user!.otpCode !== otpCode) {
			user!.decrement('incorrectOtpAttempt')
			await user.save()
			return errorHandler({
				res,
				err: Messages.INCORRECT_OTP,
				statusCode: 502,
				data: {
					remainingOtpAttempt: user.incorrectOtpAttempt - 1,
				},
			})
		}
		if (user!.otpExpire <= new Date()) {
			return errorHandler({
				res,
				err: Messages.OTP_EXPIRED,
				statusCode: 502,
			})
		}

		let response = {
			id: user!.id,
			email: user!.email,
			accountType: user!.accountType,
			name: user!.entityType === 'COMPANY' ? user!.companyName : user!.name,
			userType: user!.userType,
		}
		const tokenResponse = (await axios
			.post(`${Config.SERVICES.AUTH}/api/v1/auth/generateToken`, response)
			.catch((err) => {
				return errorHandler({
					res,
					err: err,
					statusCode: 502,
				})
			}))!
		const token: string = tokenResponse.data.data.token
		if (fcmToken !== undefined || fcmToken !== '') {
			await subscribeTopic(fcmToken, user.id, `user-${user.id}`, token)

			if (user.isEchoSubscribed === true) {
				await subscribeTopic(fcmToken, user.id, 'echo-users', token)
			}
		}

		if (!user.emailVerified) {
			await axios
				.post(
					`${Config.NOTIFICATION.SEND}/${user.id}`,
					{
						title: 'Welcome to EnverX',
						body: `Welcome to EnverX. Complete your verification to ${
							user.userType === 'INVESTOR' ? 'Start Investing' : 'Create Project'
						}`,
						topic: `user-${user.id}`,
					},
					{
						headers: {
							authorization: `Bearer ${token}`,
						},
					}
				)
				.catch((err) => {
					Logger.error(err)
				})
		}
		user.emailVerified = true
		user.loginAttempt = 5
		user.isLoginBlocked = false
		user.loginBlockedTime = new Date()
		await user.save()
		await updateOTPService(null, email)
		return responseHandler({
			res,
			data: { email, token, userType: user!.userType, entityType: user!.entityType },
			msg: Messages.LOGIN_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, statusCode: 400, data: { error } })
	}
}

export const sendMobileotp = async (req: Request, res: Response) => {
	Logger.info('inside send mobile otp controller')
	try {
		const id = req.user.id
		const payload: { mobileNumber: number; countryCode: string } = req.body

		const { error, message } = await mobileOtpValidation(payload)

		if (error) {
			return errorHandler({ res, statusCode: 501, err: message })
		}

		const user = await getUserService({ id })
		if (user === null) {
			return errorHandler({
				res,
				err: Messages.USER_NOT_FOUND,
				statusCode: 502,
			})
		}
		let response = {
			id: user!.id,
			email: user!.email,
			otpMobileLimit: user!.otpMobileLimit - 1,
		}
		if (user!.mobileNumber !== payload.mobileNumber || user.countryCode !== payload.countryCode) {
			const { error, message } = await mobileOtpValidation(payload)

			if (error) {
				return errorHandler({ res, statusCode: 501, err: message })
			}

			const result = await updateUserService(payload, id)

			if (result === null) {
				return errorHandler({ res, statusCode: 500, err: Messages.USER_UPDATE_FAILED })
			}

			const otp = Math.floor(100000 + Math.random() * 900000)
			const smsData = await sendSMS(payload.countryCode, payload.mobileNumber, user!.email, otp)
			if (smsData) {
				user.mobileNoVerified = false
				await user.save()
				return responseHandler({
					res,
					data: response,
					msg: Messages.OTP_SENT_MOBILE,
				})
			} else {
				return errorHandler({
					res,
					err: Messages.OTP_SENT_FAILED,
					statusCode: 502,
				})
			}
		}
		const otp = Math.floor(100000 + Math.random() * 900000)

		const smsData = await sendSMS(user!.countryCode, user!.mobileNumber, user!.email, otp)
		if (smsData) {
			return responseHandler({
				res,
				data: response,
				msg: Messages.OTP_SENT_MOBILE,
			})
		} else {
			return errorHandler({
				res,
				err: Messages.OTP_SENT_FAILED,
				statusCode: 502,
			})
		}
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, statusCode: 400, data: { error } })
	}
}

export const sendEmailOtp = async (req: Request, res: Response) => {
	Logger.info('inside sendEmailOTP controller')
	try {
		const payload: { email: string } = req.body

		const { error, message } = await emailValidation(payload)

		if (error) {
			return errorHandler({ res, statusCode: 501, err: message })
		}

		const user = await getUserService(payload)
		if (user === null) {
			return errorHandler({
				res,
				err: Messages.USER_NOT_FOUND,
				statusCode: 502,
			})
		}

		let response: any = {
			id: user!.id,
			email: user!.email,
			loginAttempt: user!.loginAttempt,
			loginBlockedTime: user!.loginBlockedTime,
			otplimit: user!.otpLimit,
			otpBlockTime: user!.otpBlockTime,
			isOTPBlocked: user!.isOTPBlocked,
			isLoginBlocked: user!.isLoginBlocked,
		}
		const otp = Math.floor(100000 + Math.random() * 900000)

		await saveUserOTP(user.mobileNumber, user.countryCode, user.email, otp)

		const emailPayload = {
			data: otp.toString(),
			email: user!.email,
		}
		const emailSent = await sendEmail(emailPayload, 'sendVerification')

		if (emailSent?.error) {
			response.error = emailSent?.error
			return errorHandler({
				res,
				statusCode: 400,
				err: Messages.OTP_SENT_EMAIL_FAILED,
				data: response,
			})
		}
		response.otplimit -= 1
		return responseHandler({ res, status: 201, msg: Messages.OTP_SENT_EMAIL, data: response })
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, statusCode: 400, data: { error } })
	}
}

export const verifyMobileNo = async (req: Request, res: Response) => {
	Logger.info('Inside verify mobileNo controller')
	try {
		const id = req.user.id
		const { otpCode, mobileNumber, countryCode } = req.body

		const user = await getUserService({ id, mobileNumber, countryCode })
		if (user === null) {
			return errorHandler({
				res,
				err: Messages.USER_NOT_FOUND,
				statusCode: 502,
			})
		}

		if (user.incorrectOtpAttempt === 0) {
			return errorHandler({
				res,
				err: Messages.OTP_EXPIRED,
				statusCode: 502,
			})
		}

		if (user!.otpCode !== otpCode) {
			user!.decrement('incorrectOtpAttempt')
			await user.save()
			return errorHandler({
				res,
				err: Messages.INCORRECT_OTP,
				statusCode: 502,
				data: {
					remainingOtpAttempt: user.incorrectOtpAttempt - 1,
				},
			})
		}

		if (user!.otpExpire <= new Date()) {
			return errorHandler({
				res,
				err: Messages.OTP_EXPIRED,
				statusCode: 502,
			})
		}

		user!.mobileNoVerified = true
		user!.otpCode = null!
		user!.mobileOtpBlocked = false
		user!.otpMobileLimit = 5
		await user.save()

		return responseHandler({ res, status: 201, msg: Messages.MOBILE_VERIFIED_SUCCESS })
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, statusCode: 400, data: { error } })
	}
}

export const forgotPassword = async (req: Request, res: Response, next: any) => {
	Logger.info('Inside Forgot Password controller')
	try {
		const { email }: { email: string } = req.body
		const validator = await forgotPasswordValidation({ email })
		if (validator.error) {
			return errorHandler({ res, err: validator.message })
		}
		const resetToken = await createPasswordResetToken(email)

		if (resetToken === null) {
			return errorHandler({
				res,
				err: Messages.EMAIL_NOT_REGISTERED,
				statusCode: 502,
			})
		}

		const passwordURL = `${Config.CREATE_PASSWORD.FE_CREATE_PASSWORD_URL}/${resetToken}`

		let emailPayload = {
			data: passwordURL,
			email,
		}

		const emailSent = await sendEmail(emailPayload, 'sendVerficationURL')

		if (emailSent?.error) {
			return errorHandler({
				res,
				statusCode: 400,
				err: Messages.OTP_SENT_EMAIL_FAILED,
				data: emailSent?.error,
			})
		}
		return responseHandler({ res, status: 201, msg: Messages.PASSWORD_RESET_LINK_SENT_EMAIL })
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, statusCode: 400, data: { error } })
	}
}

export const resetPassword = async (req: Request, res: Response, next: any) => {
	Logger.info('Inside Reset Password controller')
	try {
		const { password, resetId }: { password: string; resetId: string } = req.body
		const payload = { password, resetId }
		const validator = await resetPasswordRequest(payload)
		if (validator.error) {
			return errorHandler({ res, err: validator.message })
		}
		const userData = await resetPasswordService(password, resetId)

		if (userData === null) {
			return errorHandler({ res, err: Messages.PASSWORD_RESET_LINK_EXPIRED })
		} else if (userData === false) {
			return errorHandler({ res, err: Messages.RESET_SAME_PASSWORD })
		} else {
			return responseHandler({ res, msg: Messages.CREATE_PASSWORD_SUCCESS })
		}
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, statusCode: 400, data: { error } })
	}
}

export const getUser = async (req: Request, res: Response) => {
	try {
		Logger.info('inside get user controller')
		const { userId } = req.params
		const { id } = req.user
		const user = await getUserService({ id: userId })
		if (user === null) {
			return errorHandler({
				res,
				err: Messages.USER_NOT_FOUND,
				statusCode: 502,
			})
		}

		switch (user.entityType) {
			case 'COMPANY': {
				const data = {
					companyName: user.companyName,
					companyRegistrationNumber: user.companyRegistrationNumber,
					companyWebsite: user.companyWebsite,
					email: user.email,
					country: user.country,
					state: user.state,
					postalCode: user.postalCode,
					mobileNumber: user.mobileNumber,
					profilePic: user.profilePic,
					mobileNoVerified: user.mobileNoVerified,
					kycStatus: user.kycStatus,
					kycVerificationId: user.kycVerificationId,
					userType: user.userType,
					blockchainWalletAddress: user.blockchainWalletAddress,
				}

				return responseHandler({ res, msg: Messages.GET_USER_SUCCESS, data })
			}
			case 'INDIVIDUAL': {
				const data = {
					name: user.name,
					DOB: user.DOB,
					email: user.email,
					country: user.country,
					mobileNumber: user.mobileNumber,
					profilePic: user.profilePic,
					mobileNoVerified: user.mobileNoVerified,
					kycStatus: user.kycStatus,
					kycVerificationId: user.kycVerificationId,
					userType: user.userType,
					blockchainWalletAddress: user.blockchainWalletAddress,
				}

				return responseHandler({ res, msg: Messages.GET_USER_SUCCESS, data })
			}
			default: {
				return errorHandler({
					res,
					statusCode: 502,
					err: Messages.USER_NOT_FOUND,
				})
			}
		}
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, statusCode: 400, data: { error } })
	}
}

export const getUserByAuth = async (req: Request, res: Response) => {
	try {
		Logger.info('inside get user controller')
		const { id } = req.user
		const user = await getUserService({ id })
		if (user === null) {
			return errorHandler({
				res,
				err: Messages.USER_NOT_FOUND,
				statusCode: 502,
			})
		}

		switch (user.entityType) {
			case 'COMPANY': {
				const data = {
					companyName: user.companyName,
					companyRegistrationNumber: user.companyRegistrationNumber,
					companyWebsite: user.companyWebsite,
					email: user.email,
					country: user.country,
					state: user.state,
					postalCode: user.postalCode,
					mobileNumber: user.mobileNumber,
					profilePic: user.profilePic,
					mobileNoVerified: user.mobileNoVerified,
					kycStatus: user.kycStatus,
					kycVerificationId: user.kycVerificationId,
					userType: user.userType,
					isEchoSubscribed: user.isEchoSubscribed,
					id: user.id,
					blockchainWalletAddress: user.blockchainWalletAddress,
					WalletId: user.walletId,
				}

				return responseHandler({ res, msg: Messages.GET_USER_SUCCESS, data })
			}
			case 'INDIVIDUAL': {
				const data = {
					name: user.name,
					DOB: user.DOB,
					email: user.email,
					country: user.country,
					mobileNumber: user.mobileNumber,
					profilePic: user.profilePic,
					mobileNoVerified: user.mobileNoVerified,
					kycStatus: user.kycStatus,
					kycVerificationId: user.kycVerificationId,
					userType: user.userType,
					isEchoSubscribed: user.isEchoSubscribed,
					id: user.id,
					blockchainWalletAddress: user.blockchainWalletAddress,
					WalletId: user.walletId,
				}

				return responseHandler({ res, msg: Messages.GET_USER_SUCCESS, data })
			}
			default: {
				return errorHandler({
					res,
					statusCode: 502,
					err: Messages.USER_NOT_FOUND,
				})
			}
		}
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, statusCode: 400, data: { error } })
	}
}

export const getAllUser = async (req: Request, res: Response) => {
	Logger.info('Inside Get all user controller')
	try {
		const {
			offset,
			limit,
			search,
			orderBy,
			orderType,
			userType,
			kycStatus,
			country,
			userStatus,
			entityType,
		} = req.query
		const strOffset = offset ? offset.toString() : '0'
		const strLimit = limit ? limit.toString() : '10'
		const searchText = search ? search.toString() : ''
		const strorderBy = orderBy ? orderBy.toString() : 'createdAt'
		const strorderType = orderType ? orderType.toString() : 'DESC'
		const usertype = userType ? userType.toString() : ''
		const kycstatus = kycStatus ? kycStatus.toString() : ''
		const Country = country ? country.toString() : ''
		const userstatus = userStatus ? userStatus.toString() : ''
		const entitytype = entityType ? entityType.toString() : ''

		const result = await getAllUserService(
			parseInt(strOffset!),
			parseInt(strLimit!),
			searchText,
			strorderBy,
			strorderType,
			usertype,
			kycstatus,
			Country,
			userstatus,
			entitytype
		)
		return responseHandler({ res, data: result, msg: Messages.USER_LIST_SUCCESS })
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, statusCode: 400, data: { error } })
	}
}

export const updateUser = async (req: Request, res: Response, next: any) => {
	Logger.info('Inside update User controller')
	try {
		const { option }: { option: string } = req.body

		switch (option) {
			case 'profile': {
				const {
					companyName,
					companyRegistrationNumber,
					companyWebsite,
					country,
					state,
					postalCode,
					name,
					DOB,
					profilePic,
					lastLogout,
					fcmToken,
					addressLine1,
					addressLine2,
					firstLogin,
				}: {
					companyName: string
					companyRegistrationNumber: string
					companyWebsite: string
					country: string
					state: string
					postalCode: number
					name: string
					DOB: Date
					profilePic: string
					lastLogout: Date
					fcmToken: string
					addressLine1: string
					addressLine2: string
					firstLogin: boolean
				} = req.body
				const { id } = req.user
				const user = await getUserService({ id })
				if (user === null) {
					return errorHandler({
						res,
						err: Messages.USER_NOT_FOUND,
						statusCode: 502,
					})
				}
				const validator = await updateUserValidation({
					companyName,
					companyRegistrationNumber,
					companyWebsite,
					country,
					state,
					postalCode,
					name,
					DOB,
					profilePic,
					lastLogout,
					fcmToken,
					addressLine1,
					addressLine2,
					firstLogin,
				})

				if (validator.error) {
					return errorHandler({ res, err: validator.message })
				}
				const payload: Partial<UserInterface> = {
					id: user.id,
					email: user.email,
					mobileNumber: user.mobileNumber,
					userType: user.userType === 'INVESTOR' ? 'INVESTOR' : 'PROJECT_DEVELOPER',
					entityType: user.entityType === 'COMPANY' ? 'COMPANY' : 'INDIVIDUAL',
					companyName,
					companyRegistrationNumber,
					companyWebsite,
					country,
					state,
					postalCode,
					name,
					DOB,
					profilePic,
					lastLogout,
					addressLine1,
					addressLine2,
					firstLogin,
				}
				const result = await updateUserService(payload, id)

				if (result === null) {
					return errorHandler({ res, statusCode: 500, err: Messages.USER_UPDATE_FAILED })
				}
				if (fcmToken) {
					await unSubscribeTopic(fcmToken, user.id, `user-${user.id}`, req.headers.authorization!)
					if (user.isEchoSubscribed === true)
						await unSubscribeTopic(fcmToken, user.id, `echo-users`, req.headers.authorization!)
				}

				return responseHandler({ res, msg: Messages.USER_UPDATE_SUCCESS })
			}
			case 'KYC': {
				const { kycStatus, kycVerificationId } = req.body
				const { id } = req.user
				const user = await getUserService({ id })
				if (user === null) {
					return errorHandler({
						res,
						err: Messages.USER_NOT_FOUND,
						statusCode: 502,
					})
				}
				const validator = await updateUserValidation({
					kycStatus,
					kycVerificationId,
				})

				if (validator.error) {
					return errorHandler({ res, err: validator.message })
				}

				const walletObj = {
					idempotencyKey: uuid(),
					description: user.id,
				}
				if (user.walletId && user.blockchainWalletId) {
					const payload: UserInterface = {
						id: user.id,
						email: user.email,
						mobileNumber: user.mobileNumber,
						userType: user.userType === 'INVESTOR' ? 'INVESTOR' : 'PROJECT_DEVELOPER',
						entityType: user.entityType === 'COMPANY' ? 'COMPANY' : 'INDIVIDUAL',
						kycStatus,
						kycVerificationId,
					}

					const result = await updateUserService(payload, id)

					if (result === null)
						return errorHandler({ res, statusCode: 500, err: Messages.USER_UPDATE_FAILED })

					// @todo KYC message. we will remove it once persona web hook and work flow is ready
					if (kycStatus === 'APPROVED') {
						await axios
							.post(
								`${Config.NOTIFICATION.SEND}/${user.id}`,
								{
									title: 'KYC',
									body: 'Congratulation! your KYC is successfully verified.',
									topic: `user-${user.id}`,
								},
								{
									headers: {
										authorization: req.headers.authorization!,
									},
								}
							)
							.catch((err) => {
								Logger.error(err)
							})
					}
					if (kycStatus === 'REJECTED') {
						await axios
							.post(
								`${Config.NOTIFICATION.SEND}/${user.id}`,
								{
									title: 'KYC',
									body: 'Attention! your KYC verification is failed. Please check your email to know more.',
									topic: `user-${user.id}`,
								},
								{
									headers: {
										authorization: req.headers.authorization!,
									},
								}
							)
							.catch((err) => {
								Logger.error(err)
							})
					}
					return responseHandler({ res, msg: Messages.USER_UPDATE_SUCCESS })
				}
				let circleError: boolean = false
				let errMessage: string = ''
				const circleResponse = (await axios
					.post(`${Config.PAYMENT.CREATE_WALLET}`, walletObj, {
						headers: {
							authorization: req.headers.authorization!,
						},
					})
					.catch((err) => {
						Logger.error(err)
						circleError = true
						errMessage = err.response.data.msg
					}))!
				if (circleError) {
					return errorHandler({
						res,
						statusCode: 500,
						err: errMessage,
					})
				}
				const walletId: string = circleResponse.data.data.data.walletId
				const type: string = circleResponse.data.data.data.type
				const walletDescription: string = circleResponse.data.data.data.description

				// TODO: It will be uncommented when enverX-web3-service URL is created by devops

				const venlyobj = {
					pinCode: Math.floor(1000 + Math.random() * 9000).toString(),
					description: user.id,
					identifier: 'type=recoverable',
				}
				let venlyError: boolean = false
				let errVenlyMessage: string = ''
				const venlyResponse = (await axios
					.post(`${Config.WEB3.CREATE_BLOCKCHAIN_WALLET}`, venlyobj, {
						headers: {
							authorization: req.headers.authorization!,
						},
					})
					.catch((err) => {
						Logger.error(err)
						venlyError = true
						errVenlyMessage = err.response.data.msg
					}))!
				if (venlyError) {
					return errorHandler({
						res,
						statusCode: 500,
						err: errVenlyMessage,
					})
				}
				const venlyPinCode = venlyobj.pinCode.toString()
				const blockchainWalletId = venlyResponse.data.data.result.id
				const blockchainWalletAddress = venlyResponse.data.data.result.address
				const blockchainWalletType = venlyResponse.data.data.result.walletType
				const blockchainSecretType = venlyResponse.data.data.result.secretType
				const blockchainWalletDescription = venlyResponse.data.data.result.description
				const blockchainWalletIdentifier = venlyResponse.data.data.result.identifier

				const payload: UserInterface = {
					id: user.id,
					email: user.email,
					mobileNumber: user.mobileNumber,
					userType: user.userType === 'INVESTOR' ? 'INVESTOR' : 'PROJECT_DEVELOPER',
					entityType: user.entityType === 'COMPANY' ? 'COMPANY' : 'INDIVIDUAL',
					kycStatus,
					walletId,
					walletDescription,
					walletType: type,
					kycVerificationId,
					blockchainWalletId,
					blockchainWalletAddress,
					blockchainWalletType,
					blockchainSecretType,
					blockchainWalletDescription,
					blockchainWalletIdentifier,
					venlyPinCode,
				}

				const result = await updateUserService(payload, id)

				if (result === null)
					return errorHandler({ res, statusCode: 500, err: Messages.USER_UPDATE_FAILED })

				// @todo KYC message. we will remove it once persona web hook and work flow is ready
				if (kycStatus === 'APPROVED') {
					await axios
						.post(
							`${Config.NOTIFICATION.SEND}/${user.id}`,
							{
								title: 'KYC',
								body: 'Congratulation! your KYC is successfully verified.',
								topic: `user-${user.id}`,
							},
							{
								headers: {
									authorization: req.headers.authorization!,
								},
							}
						)
						.catch((err) => {
							Logger.error(err)
						})
				}
				if (kycStatus === 'REJECTED') {
					await axios
						.post(
							`${Config.NOTIFICATION.SEND}/${user.id}`,
							{
								title: 'KYC',
								body: 'Attention! your KYC verification is failed. Please check your email to know more.',
								topic: `user-${user.id}`,
							},
							{
								headers: {
									authorization: req.headers.authorization!,
								},
							}
						)
						.catch((err) => {
							Logger.error(err)
						})
				}
				return responseHandler({ res, msg: Messages.USER_UPDATE_SUCCESS })
			}
			case 'password': {
				const { oldPassword, newPassword }: { oldPassword: string; newPassword: string } = req.body
				const { id } = req.user
				const validator = await changePasswordValidation({ oldPassword, newPassword })
				if (validator.error) {
					return errorHandler({ res, err: validator.message })
				}
				const user = await getUserService({ id })
				if (user === null) {
					return errorHandler({
						res,
						err: Messages.USER_NOT_FOUND,
						statusCode: 502,
					})
				}
				const checkPass = await checkPassword(oldPassword, user!.password)
				if (!checkPass) {
					return errorHandler({
						res,
						err: Messages.INCORRECT_PASSWORD,
						statusCode: 502,
					})
				}
				const passwordData = await checkPassword(newPassword, user!.password)
				if (passwordData) {
					return errorHandler({
						res,
						err: Messages.RESET_SAME_PASSWORD,
						statusCode: 502,
					})
				}
				const encryptedPassword = await hash(newPassword, 10)
				const userData = await createPasswordService(
					encryptedPassword,
					user!.email,
					new Date(req.user.iat * 1000)
				)
				if (userData === null) {
					return errorHandler({ res, err: Messages.CHANGE_PASSWORD_FAILED })
				} else {
					return responseHandler({ res, msg: Messages.CHANGE_PASSWORD_SUCCESS })
				}
			}
			default: {
				return errorHandler({
					res,
					statusCode: 406,
					err: Messages.WRONG_INPUT_PROVIDED,
				})
			}
		}
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, statusCode: 400, data: { error } })
	}
}

export const updateUserStatus = async (req: Request, res: Response) => {
	Logger.info('Inside update user status controller')
	try {
		const { userId } = req.params
		const {
			isPurchaser,
			isBlocked,
		}: {
			isPurchaser: boolean
			isBlocked: boolean
		} = req.body

		const user = await getUserService({ id: userId })
		if (user === null) {
			return errorHandler({
				res,
				err: Messages.USER_NOT_FOUND,
				statusCode: 502,
			})
		}
		const validator = await updateUserValidation({
			isPurchaser,
			isBlocked,
		})
		if (validator.error) {
			return errorHandler({ res, err: validator.message })
		}

		const result = await updateUserService({ isPurchaser, isBlocked }, userId)

		if (result === null)
			return errorHandler({ res, statusCode: 500, err: Messages.USER_UPDATE_FAILED })

		return responseHandler({ res, msg: Messages.USER_STATUS_UPDATE_SUCCESS })
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, statusCode: 400, data: { error } })
	}
}

export const accountProgress = async (req: Request, res: Response) => {
	Logger.info('Inside user accountProgress controller')
	try {
		const id = req.user.id
		const user = await getUserService({ id })

		if (user === null) {
			return errorHandler({ res, statusCode: 403, err: Messages.USER_NOT_FOUND })
		}

		// TODO: will add project created or started investing progress response in future
		const data = {
			isRegistered: user.isRegistered,
			kycStatus: user.kycStatus,
		}
		return responseHandler({ res, msg: Messages.GET_ACCOUNT_PROGRESS_SUCCESS, data })
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, statusCode: 400, data: { error } })
	}
}

export const createBankAccount = async (req: Request, res: Response) => {
	Logger.info('Inside Create Bank Account controller')
	try {
		let {
			account_number,
			routing_number,
			IBAN,
			account_id,
			status,
			description,
			trackingRef,
			fingerprint,
			billing_name,
			billing_city,
			billing_country,
			billing_line1,
			billing_line2,
			billing_district,
			billing_postalCode,
			bank_name,
			bank_city,
			bank_country,
			bank_line1,
			bank_line2,
			bank_district,
			type_of_account,
		} = req.body
		const userId = req.user.id
		const payload: BankDetailsInterfacte = {
			id: uuid(),
			account_number,
			routing_number,
			IBAN,
			account_id,
			status,
			description,
			tracking_ref: trackingRef,
			fingerprint,
			billing_name,
			billing_city,
			billing_country,
			billing_line1,
			billing_line2,
			billing_district,
			billing_postalCode,
			bank_name,
			bank_city,
			bank_country,
			bank_line1,
			bank_line2,
			bank_district,
			userId,
			type_of_account,
		}
		let circleError: boolean = false
		let errMessage: string = ''
		if (Config.CIRCLE.CIRCLE_TEST_DATA) {
			Logger.info('Adding default circle data')
			payload.account_number = Config.CIRCLE.ACCOUNT_NUMBER!
			payload.routing_number = Config.CIRCLE.ROUTING_NUMBER!
			payload.billing_city = Config.CIRCLE.BILLING_CITY!
			payload.billing_country = Config.CIRCLE.BILLING_COUNTRY!
			payload.billing_district = Config.CIRCLE.BILLING_DISTRICT!
			payload.billing_line1 = Config.CIRCLE.BILLING_LINE1!
			payload.billing_postalCode = Config.CIRCLE.POSTAL_CODE!
			payload.bank_country = Config.CIRCLE.BANK_COUNTRY!
			payload.bank_district = Config.CIRCLE.BANK_DISTRICT!
		}
		const circleResponse = (await axios
			.post(`${Config.PAYMENT.CREATE_BANK_ACCOUNT}`, payload, {
				headers: {
					authorization: req.headers.authorization!,
				},
			})
			.catch((err) => {
				Logger.error(err)
				circleError = true
				errMessage = err.response.data.msg
			}))!
		if (circleError) {
			await axios
				.post(
					`${Config.NOTIFICATION.SEND}/${req.user.id}`,
					{
						title: 'Bank A/C',
						body: `Attention! Your ${payload.bank_name} A/C linking with EnverX is failed. Please try again.`,
						topic: `user-${req.user.id}`,
					},
					{
						headers: {
							authorization: req.headers.authorization!,
						},
					}
				)
				.catch((err) => {
					Logger.error(err)
				})
			return errorHandler({
				res,
				statusCode: 500,
				err: errMessage,
			})
		}
		payload.account_id = circleResponse.data.data.data.id
		payload.status = circleResponse.data.data.data.status
		payload.tracking_ref = circleResponse.data.data.data.trackingRef
		payload.fingerprint = circleResponse.data.data.data.fingerprint
		payload.description = circleResponse.data.data.data.description
		const bankData = await createBankAccountService(payload)
		if (bankData === null) {
			await axios
				.post(
					`${Config.NOTIFICATION.SEND}/${req.user.id}`,
					{
						title: 'Bank A/C',
						body: `Attention! Your ${payload.bank_name} A/C linking with EnverX is failed. Please try again.`,
						topic: `user-${req.user.id}`,
					},
					{
						headers: {
							authorization: req.headers.authorization!,
						},
					}
				)
				.catch((err) => {
					Logger.error(err)
				})
			return errorHandler({
				res,
				statusCode: 500,
				err: Messages.BANK_ACCOUNT_CREATED_FAILED,
			})
		}

		await axios
			.post(
				`${Config.NOTIFICATION.SEND}/${req.user.id}`,
				{
					title: 'Bank A/C',
					body: `${payload.bank_name} a/c is linked to EnverX successfully`,
					topic: `user-${req.user.id}`,
				},
				{
					headers: {
						authorization: req.headers.authorization!,
					},
				}
			)
			.catch((err) => {
				Logger.error(err)
			})
		return responseHandler({
			res,
			status: 201,
			msg: Messages.BANK_ACCOUNT_CREATED_SUCCESS,
			data: bankData,
		})
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, statusCode: 400, data: { error } })
	}
}

export const getBankAccount = async (req: Request, res: Response) => {
	Logger.info('Inside Get Bank Account controller')
	try {
		const userId = req.user.id
		const { type } = req.params
		const accountList = await getBankAccountService(userId, type)
		return responseHandler({
			res,
			status: 201,
			data: accountList,
			msg: Messages.ACCOUNT_LIST_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, statusCode: 400, data: { error } })
	}
}

export const createWallet = async (req: Request, res: Response) => {
	Logger.info('Inside Create Bank Account controller')
	try {
		const { description }: { description: string } = req.body
		const userId = req.user.id
		const userData = await getUserService({ id: userId })
		if (userData === null) {
			return errorHandler({
				res,
				statusCode: 500,
				err: Messages.USER_NOT_FOUND,
			})
		}
		const payload = {
			idempotencyKey: uuid(),
			description: userData.id,
		}
		if (userData.walletId) {
			return errorHandler({
				res,
				statusCode: 502,
				err: Messages.WALLET_ALREADY_CREATED,
			})
		}
		let circleError: boolean = false
		let errMessage: string = ''
		const circleResponse = (await axios
			.post(`${Config.PAYMENT.CREATE_WALLET}`, payload, {
				headers: {
					authorization: req.headers.authorization!,
				},
			})
			.catch((err) => {
				Logger.error(err)
				circleError = true
				errMessage = err.response.data.msg
			}))!
		if (circleError) {
			return errorHandler({
				res,
				statusCode: 500,
				err: errMessage,
			})
		}
		const walletId: string = circleResponse.data.data.data.walletId
		const type: string = circleResponse.data.data.data.type
		const walletDescription: string = circleResponse.data.data.data.description
		const walletDetails = await addWalletId(userId, walletId, walletDescription, type)
		if (walletDetails !== undefined || walletDetails === null)
			return errorHandler({
				res,
				statusCode: 500,
				err: Messages.WALLET_CREATED_FAILED,
			})
		return responseHandler({
			res,
			status: 201,
			msg: Messages.WALLET_CREATED_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, statusCode: 400, data: { error } })
	}
}

export const updateBankDetail = async (req: Request, res: Response) => {
	Logger.info('Inside update Bank Account controller')
	try {
		const {
			accountId,
			status,
			trackingRef,
		}: { accountId: string; status: string; trackingRef: string } = req.body

		const bank = await getBankAccountByIdService(accountId)
		if (!bank) {
			return responseHandler({
				res,
				status: 208,
				msg: Messages.BANK_ACCOUNT_NOT_FOUND,
			})
		}
		const bankDetails = await updateBankAcccountService(accountId, status, trackingRef)
		if (bankDetails === null) {
			return errorHandler({
				res,
				statusCode: 500,
				err: Messages.BANK_ACCOUNT_UPDATE_FAILED,
			})
		}
		return responseHandler({
			res,
			status: 201,
			msg: Messages.BANK_ACCOUNT_CREATED_SUCCESS,
		})
	} catch (err) {
		Logger.error(err)
	}
}

export const createACHBankAccount = async (req: Request, res: Response) => {
	Logger.info('Inside Create ACH Bank Account controller')
	try {
		const { billing_name, type_of_account, plaid_processer_token, session_id, ip_address } =
			req.body

		const userId = req.user.id
		const user = await getUserService({ id: userId })
		if (user === null) {
			return errorHandler({
				res,
				err: Messages.USER_NOT_FOUND,
				statusCode: 502,
			})
		}
		const payload: BankDetailsInterfacte = {
			id: uuid(),
			billing_name,
			plaid_processer_token,
			ip_address,
			session_id,
			type_of_account,
		}
		let circleError: boolean = false
		let errMessage: string = ''
		const circleResponse = (await axios
			.post(`${Config.PAYMENT.CREATE_ACH_BANK_ACCOUNT}`, payload, {
				headers: {
					authorization: req.headers.authorization!,
				},
			})
			.catch((err) => {
				Logger.error(err)
				circleError = true
				errMessage = err.response.data.msg
			}))!
		if (circleError) {
			return errorHandler({
				res,
				statusCode: 500,
				err: errMessage,
			})
		}
		payload.account_id = circleResponse.data.data.data.id
		payload.status = circleResponse.data.data.data.status
		payload.userId = userId
		payload.email = user.email
		const bankData = await createBankAccountService(payload)
		if (bankData === null)
			return errorHandler({
				res,
				statusCode: 500,
				err: Messages.BANK_ACCOUNT_CREATED_FAILED,
			})
		return responseHandler({
			res,
			status: 201,
			msg: Messages.BANK_ACCOUNT_CREATED_SUCCESS,
			data: bankData,
		})
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, statusCode: 400, data: { error } })
	}
}

export const updateACHBankDetail = async (req: Request, res: Response) => {
	Logger.info('Inside update ACH Bank Account controller')
	try {
		const {
			accountId,
			status,
			accountNumber,
			routingNumber,
			description,
			bankName,
			line1,
			city,
			district,
			country,
			fingerprint,
		}: {
			accountId: string
			status: string
			accountNumber: string
			routingNumber: string
			description: string
			bankName: string
			line1: string
			city: string
			district: string
			country: string
			fingerprint: string
		} = req.body
		const bank = await getBankAccountByIdService(accountId)
		if (!bank) {
			return responseHandler({
				res,
				status: 208,
				msg: Messages.BANK_ACCOUNT_NOT_FOUND,
			})
		}
		const bankDetails = await updateACHBankAcccountService(
			accountId,
			status,
			accountNumber,
			routingNumber,
			description,
			bankName,
			line1,
			city,
			district,
			country,
			fingerprint
		)
		if (bankDetails === null) {
			return errorHandler({
				res,
				statusCode: 500,
				err: Messages.BANK_ACCOUNT_UPDATE_FAILED,
			})
		}
		return responseHandler({
			res,
			status: 201,
			msg: Messages.BANK_ACCOUNT_CREATED_SUCCESS,
		})
	} catch (err) {
		Logger.error(err)
	}
}

export const deleteBankAccount = async (req: Request, res: Response) => {
	Logger.info('Inside Delete Bank Account controller')
	try {
		const { accountId } = req.params
		const bankDetails = await deleteBankAcccountService(accountId)
		if (bankDetails === null) {
			return errorHandler({
				res,
				statusCode: 500,
				err: Messages.BANK_ACCOUNT_DELETE_FAILED,
			})
		}
		return responseHandler({
			res,
			status: 201,
			msg: Messages.BANK_ACCOUNT_DELETE_SUCCESS,
		})
	} catch (err) {
		Logger.error(err)
	}
}

export const getBlockchainWalletDetails = async (req: Request, res: Response) => {
	Logger.info('Inside Get Blockchain Wallet Details controller')
	try {
		const { userId } = req.params
		const blockchainDetails = await getBlockchainDetailsService(userId)
		if (!blockchainDetails) {
			return errorHandler({
				res,
				statusCode: 500,
				err: Messages.USER_NOT_FOUND,
			})
		}
	} catch (err) {
		Logger.error(err)
	}
}

export const getEchoUsers = async (req: Request, res: Response) => {
	Logger.info('Inside Get Echo users controller')
	try {
		const { offset, limit, search } = req.query
		const strOffset = offset?.toString() || '0'
		const strLimit = limit?.toString() || '10'
		const strsearch = search?.toString() || undefined

		if (parseInt(strLimit) > 20)
			return errorHandler({ res, statusCode: 400, err: Messages.RECORDS_LIMIT_ERROR })

		const data = await getEchoUsersService(parseInt(strOffset!), parseInt(strLimit!), strsearch)
		return responseHandler({ res, data, msg: Messages.GET_ECHO_USER_SUCCESS })
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, data: { error } })
	}
}

export const updateEchoUser = async (req: Request, res: Response) => {
	Logger.info('Inside Update Echo users controller')
	try {
		const validator = await updateEchoUserValidation(req.body)
		if (validator.error) {
			return errorHandler({ res, err: validator.message })
		}
		const user = await getEchoUserService(req.params.userId)
		if (!user) {
			return errorHandler({
				res,
				err: Messages.USER_NOT_FOUND,
				statusCode: 400,
			})
		}
		const data = await updateEchoUserService(req.body, { id: req.params.userId })
		if (data === 0)
			return errorHandler({
				res,
				statusCode: 402,
			})

		return responseHandler({ res, msg: Messages.UPDATE_ECHO_USER_SUCCESS })
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, data: { error } })
	}
}

export const getEchoSubscriberCount = async (req: Request, res: Response) => {
	Logger.info('Inside Get Echo Subscriber Count controller')
	try {
		const data = await getEchoSubscriberCountService()

		return responseHandler({
			res,
			data,
			msg: Messages.GET_ECHO_SUBSCRIBER_COUNT_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, data: { error } })
	}
}

export const createEchoUser = async (req: Request, res: Response) => {
	Logger.info('Inside Get Echo Subscriber Count controller')
	try {
		const validator = await createEchoUserValidation(req.body)

		if (validator.error) {
			return errorHandler({ res, err: validator.message })
		}

		const payload: UserInterface = req.body

		const checkEmail = await getUserService({
			email: payload.email,
		})

		if (checkEmail) {
			if (checkEmail.isEchoBlocked === true) {
				const updatedData = await updateEchoUserService(
					{
						isEchoBlocked: false,
						isEchoSubscribed: payload.isEchoSubscribed,
						echoStartDate: payload.echoStartDate,
						echoEndDate: payload.echoEndDate,
					},
					{
						id: checkEmail.id,
					}
				)

				if (updatedData === 0)
					return errorHandler({
						res,
					})

				return responseHandler({
					res,
					msg: Messages.CREATE_ECHO_USER_SUCCESS,
				})
			} else {
				return errorHandler({
					res,
					err: Messages.EMAIL_EXIST,
				})
			}
		}

		payload.id = uuid()
		payload.userType = 'ECHOSUBSCRIBER'
		await createEchoUserService(payload)

		return responseHandler({
			res,
			msg: Messages.CREATE_ECHO_USER_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, data: { error } })
	}
}

export const updatePriceLastUpdated = async (req: Request, res: Response) => {
	Logger.info('Inside Price Last Updated controller')
	try {
		const validator = await priceLastUpdatedValidation(req.body)
		if (validator.error) {
			return errorHandler({ res, err: validator.message })
		}

		const data = await updateEchoUserService(req.body, { id: req.user.id })
		if (data === 0)
			return errorHandler({
				res,
				statusCode: 402,
			})

		return responseHandler({ res, msg: Messages.UPDATE_ECHO_USER_SUCCESS })
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, data: { error } })
	}
}

export const createNewUser = async (req: Request, res: Response) => {
	Logger.info('Inside create New User controller')
	try {
		const payload: UserInterface = req.body
		const { email, password, userType } = req.body
		const validator = await createNewUserValidator({ email, password, userType })
		if (validator.error) {
			return errorHandler({ res, statusCode: 400, err: validator.message })
		}

		const checkEmail = await getUserService({
			email: payload.email,
		})
		if (checkEmail) return errorHandler({ res, statusCode: 409, err: Messages.EMAIL_EXIST })

		payload.password! = await hash(payload.password!, 10)
		payload.id = uuid()

		const user = await createNewUserService(payload)

		const randomString = GenerateRandomStringOfLength(10)
		const emailPayload = {
			data: `${Config.FE_EMAIL_VERIFICATION_URL}/${randomString}`,
			email: user.email,
		}
		const emailSent = await sendEmail(emailPayload, 'sendEmailVerification')

		if (emailSent?.error) {
			return errorHandler({
				res,
				statusCode: 400,
				err: Messages.VERIFICATION_LINK_SENT_EMAIL_FAILED,
				data: emailSent?.error,
			})
		}
		await updateUserService(
			{
				emailVerificationToken: randomString,
				emailVerificationExpiry: moment(new Date()).add(1, 'hour').utc().toDate(),
			},
			user.id
		)

		return responseHandler({
			res,
			status: 201,
			msg: Messages.EMAIL_VERIFICATION_SENT,
			data: { email },
		})
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, statusCode: 500, err: Messages.INTERNAL_SERVER_ERROR })
	}
}

export const twoFAUpdateRequest = async (req: Request, res: Response) => {
	Logger.info('inside two FA Update request controller')
	try {
		const { twoFAType } = req.body
		const { id } = req.user
		const validator = await twoFAUpdateRequestValidation({ twoFAType })
		if (validator.error) {
			return errorHandler({ res, err: validator.message })
		}
		const user = await getUserService({ id })
		if (user === null) {
			return errorHandler({
				res,
				err: Messages.USER_NOT_FOUND,
				statusCode: 502,
			})
		}
		switch (twoFAType) {
			case 'AUTH': {
				const response = await authenticatorGenerator(user?.email)
				if (response.error) {
					return errorHandler({ res, err: Messages.SOMETHING_WENT_WRONG, statusCode: 500 })
				}
				const data = await updateUserService(
					{
						authSecret: response.secret,
					},
					id
				)
				if (data === null) {
					return errorHandler({ res, err: Messages.TWOFA_UPDATE_FAILED, statusCode: 500 })
				}
				return responseHandler({
					res,
					msg: Messages.AUTHENTICATOR_SETUP_DONE,
					data: response,
				})
			}
			case 'NONE': {
				const update = await updateUserService(
					{
						twoFAStatus: true,
						twoFAType,
					},
					id
				)
				if (update === null) {
					return errorHandler({ res, err: Messages.TWOFA_UPDATE_FAILED, statusCode: 500 })
				}
				return responseHandler({
					res,
					msg: Messages.SECURITY_SETTINGS_UPDATED,
					data: { twoFAType },
				})
			}
			case 'SMS': {
				if (user.mobileNoVerified) {
					const update = await updateUserService(
						{
							twoFAStatus: true,
							twoFAType,
						},
						id
					)
					if (update === null) {
						return errorHandler({ res, err: Messages.TWOFA_UPDATE_FAILED, statusCode: 500 })
					}
					return responseHandler({
						res,
						msg: Messages.SECURITY_SETTINGS_UPDATED,
						data: { mobileNoVerified: user.mobileNoVerified, twoFAType },
					})
				}
				const otp = Math.floor(100000 + Math.random() * 900000)
				const smsData = await sendSMS(user.countryCode, user.mobileNumber, user!.email, otp)
				if (smsData) {
					return responseHandler({
						res,
						data: {
							mobileNumber: user.mobileNumber,
							countryCode: user.countryCode,
							mobileNoVerified: user.mobileNoVerified,
							email: user.email,
							twoFAType,
						},
						msg: Messages.OTP_SENT_MOBILE,
					})
				} else {
					return errorHandler({
						res,
						err: Messages.OTP_SENT_FAILED,
						statusCode: 502,
					})
				}
			}
			default: {
				return errorHandler({ res, err: Messages.INVALID_TWOFA_TYPE, statusCode: 500 })
			}
		}
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, data: { error } })
	}
}

export const verifySecurityUpdate = async (req: Request, res: Response) => {
	Logger.info('inside verify security Update controller')
	try {
		const {
			method,
			code,
		}: {
			method: string
			code: number
		} = req.body
		const validator = await securityUpdateRequestValidation(req.body)
		if (validator.error) {
			return errorHandler({ res, err: validator.message })
		}
		const { id } = req.user
		const user = await getUserService({ id })
		if (user === null) {
			return errorHandler({
				res,
				err: Messages.USER_NOT_FOUND,
				statusCode: 502,
			})
		}
		if (method === 'SMS') {
			if (user!.otpCode !== code) {
				return errorHandler({
					res,
					err: Messages.INCORRECT_OTP,
					statusCode: 502,
				})
			}
			const update = await updateUserService(
				{
					twoFAStatus: true,
					twoFAType: method,
					mobileNoVerified: true,
					otpCode: null!,
				},
				id
			)
			if (update === null) {
				return errorHandler({ res, err: Messages.TWOFA_UPDATE_FAILED, statusCode: 500 })
			}
			return responseHandler({
				res,
				msg: Messages.SECURITY_SETTINGS_UPDATED,
				data: { twoFAType: method },
			})
		}
		if (method === 'AUTH') {
			const checkAuthCode = await validateAuthCode(code, user.authSecret)
			if (!checkAuthCode) {
				return errorHandler({
					res,
					err: Messages.INCORRECT_OTP,
					statusCode: 502,
				})
			}
			const update = await updateUserService(
				{
					twoFAStatus: true,
					twoFAType: method,
				},
				id
			)
			if (update === null) {
				return errorHandler({ res, err: Messages.TWOFA_UPDATE_FAILED, statusCode: 500 })
			}
			return responseHandler({
				res,
				msg: Messages.SECURITY_SETTINGS_UPDATED,
				data: { twoFAType: method },
			})
		}
		return responseHandler({
			res,
			msg: Messages.SECURITY_SETTINGS_UPDATED,
			data: { twoFAType: method },
		})
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, data: { error } })
	}
}

export const newUserLogin = async (req: Request, res: Response) => {
	Logger.info('Inside New User Login controller')
	try {
		const { email, password } = req.body

		const validator = await newUserloginRequestValidate(req.body)
		if (validator.error) {
			return errorHandler({ res, err: validator.message })
		}
		const user = await getUserService({ email })
		if (user === null) {
			return errorHandler({
				res,
				err: Messages.EMAIL_NOT_REGISTERED,
				statusCode: 502,
			})
		}
		let resData: any = {
			mobileNumber: user.mobileNumber,
			countryCode: user.countryCode,
			email: user.email,
			loginAttempt: user.loginAttempt,
			loginBlockedTime: user.loginBlockedTime,
			otplimit: user.otpLimit,
			otpBlockTime: user.otpBlockTime,
			isOTPBlocked: user.isOTPBlocked,
			isLoginBlocked: user.isLoginBlocked,
			twoFAStatus: user.twoFAStatus,
			twoFAType: user.twoFAType,
			entityType: user.entityType,
			userType: user.entityType,
		}
		const correctUser = await verifyPassword(password, user.password)

		if (!correctUser) {
			user!.decrement('loginAttempt')
			resData.loginAttempt -= 1
			await user.save()
			return errorHandler({
				res,
				err: Messages.INCORRECT_PASSWORD,
				statusCode: 502,
				data: resData,
			})
		}
		if (!user.emailVerified) {
			return errorHandler({
				res,
				err: Messages.EMAIL_UNVERIFIED,
				data: { emailVerified: false },
				statusCode: 400,
			})
		}

		let response = {
			id: user!.id,
			email: user!.email,
			accountType: user!.accountType,
			name: user!.entityType === 'COMPANY' ? user!.companyName : user!.name,
			userType: user!.userType,
		}
		if (user.twoFAStatus) {
			switch (user.twoFAType) {
				case 'AUTH': {
					return responseHandler({
						res,
						data: resData,
						msg: Messages.VERIFY_AUTH_CODE,
					})
				}
				case 'SMS': {
					const otp = Math.floor(100000 + Math.random() * 900000)

					const smsData = await sendSMS(user!.countryCode, user!.mobileNumber, user!.email, otp)
					if (smsData) {
						return responseHandler({
							res,
							data: resData,
							msg: Messages.OTP_SENT_MOBILE,
						})
					} else {
						return errorHandler({
							res,
							err: Messages.OTP_SENT_FAILED,
							statusCode: 502,
						})
					}
				}
				case 'NONE': {
					const tokenResponse = (await axios
						.post(`${Config.SERVICES.AUTH}/api/v1/auth/generateToken`, response)
						.catch((err) => {
							return errorHandler({
								res,
								err: err,
								statusCode: 502,
							})
						}))!
					const token: string = tokenResponse.data.data.token
					resData.token = token

					if (user.caxtonPassword) {
						const caxtonData = await caxtonUserLoginService(token, {
							userEmail: user.email,
							password: user.caxtonPassword,
							deviceId: '',
							device: '',
							operatingSystem: '',
						})

						if (caxtonData) {
							resData.userAPIToken = caxtonData.userAPIToken
							resData.expireDate = caxtonData.expireDate
						}
					}

					return responseHandler({
						res,
						data: resData,
						msg: Messages.LOGIN_SUCCESS,
					})
				}
				default:
					return errorHandler({ res, err: Messages.INVALID_TWOFA_TYPE, statusCode: 500 })
			}
		}
		const tokenResponse = (await axios
			.post(`${Config.SERVICES.AUTH}/api/v1/auth/generateToken`, response)
			.catch((err) => {
				return errorHandler({
					res,
					err: err,
					statusCode: 502,
				})
			}))!
		const token: string = tokenResponse.data.data.token
		resData.token = token
		return responseHandler({
			res,
			data: resData,
			msg: Messages.LOGIN_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, data: { error } })
	}
}

export const verifyEmail = async (req: Request, res: Response) => {
	Logger.info('Inside verify email verification controller')
	try {
		const { emailTokenId } = req.body
		if (!emailTokenId) {
			return errorHandler({
				res,
				err: Messages.EMAIL_TOKEN_REQUIRED,
				statusCode: 400,
			})
		}
		const user = await getUserService({ emailVerificationToken: emailTokenId })
		if (!user) {
			return errorHandler({
				res,
				err: Messages.VERIFICATION_LINK_EXPIRED,
				statusCode: 502,
			})
		}

		if (
			moment(user.emailVerificationExpiry.toUTCString()).isSameOrBefore(new Date().toUTCString())
		) {
			return errorHandler({
				res,
				err: Messages.VERIFICATION_LINK_EXPIRED,
				statusCode: 502,
			})
		}
		const update = await updateUserService(
			{
				emailVerified: true,
				emailVerificationExpiry: null!,
				emailVerificationToken: null!,
			},
			user.id
		)
		if (update === null) {
			return errorHandler({
				res,
				err: Messages.SOMETHING_WENT_WRONG,
				statusCode: 500,
			})
		}

		return responseHandler({
			res,
			msg: Messages.EMAIL_VERIFIED,
		})
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, data: { error } })
	}
}

export const sendEmailVerification = async (req: Request, res: Response) => {
	Logger.info('Inside send email verification controller')
	try {
		const { email } = req.body
		const validate = await sendEmailValidation({ email })
		if (validate?.error) {
			return errorHandler({ res, err: validate.message })
		}
		const user = await getUserService({ email })

		if (user === null) {
			return errorHandler({
				res,
				err: Messages.EMAIL_NOT_REGISTERED,
				statusCode: 502,
			})
		}

		if (user.emailVerified) {
			return errorHandler({
				res,
				err: Messages.EMAIL_ALREADY_VERIFIED,
				statusCode: 502,
			})
		}

		const randomString = GenerateRandomStringOfLength(10)
		const emailPayload = {
			data: `${Config.FE_EMAIL_VERIFICATION_URL}/${randomString}`,
			email: user.email,
		}
		const emailSent = await sendEmail(emailPayload, 'sendEmailVerification')

		if (emailSent?.error) {
			return errorHandler({
				res,
				statusCode: 400,
				err: Messages.VERIFICATION_LINK_SENT_EMAIL_FAILED,
				data: emailSent?.error,
			})
		}
		await updateUserService(
			{
				emailVerificationToken: randomString,
				emailVerificationExpiry: moment(new Date()).add(1, 'hour').utc().toDate(),
			},
			user.id
		)

		return responseHandler({
			res,
			status: 201,
			msg: Messages.EMAIL_VERIFICATION_SENT,
			data: { email },
		})
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, data: { error } })
	}
}

export const userVerifyLogin = async (req: Request, res: Response) => {
	Logger.info('inside user verify login controller')
	try {
		const { email, code } = req.body

		const validate = await userVerifyLoginValisdation({ email, code })
		if (validate?.error) {
			return errorHandler({ res, err: validate.message })
		}
		const user = await getUserService({ email })

		if (user === null) {
			return errorHandler({
				res,
				err: Messages.USER_NOT_FOUND,
				statusCode: 502,
			})
		}

		let response = {
			id: user!.id,
			email: user!.email,
			accountType: user!.accountType,
			name: user!.entityType === 'COMPANY' ? user!.companyName : user!.name,
			userType: user!.userType,
		}
		if (user?.twoFAStatus) {
			let token: string
			switch (user.twoFAType) {
				case 'AUTH': {
					const checkAuthCode = await validateAuthCode(code, user.authSecret)
					if (!checkAuthCode) {
						return errorHandler({
							res,
							err: Messages.INCORRECT_OTP,
							statusCode: 502,
						})
					}
					const tokenResponse = (await axios
						.post(`${Config.SERVICES.AUTH}/api/v1/auth/generateToken`, response)
						.catch((err) => {
							return errorHandler({
								res,
								err: err,
								statusCode: 502,
							})
						}))!
					token = tokenResponse.data.data.token
					break
				}
				case 'SMS': {
					if (user!.otpCode !== code) {
						return errorHandler({
							res,
							err: Messages.INCORRECT_OTP,
							statusCode: 502,
						})
					}
					const tokenResponse = (await axios
						.post(`${Config.SERVICES.AUTH}/api/v1/auth/generateToken`, response)
						.catch((err) => {
							return errorHandler({
								res,
								err: err,
								statusCode: 502,
							})
						}))!
					token = tokenResponse.data.data.token
					break
				}
				default:
					return errorHandler({ res, err: Messages.INVALID_TWOFA_TYPE, statusCode: 500 })
			}

			let userAPIToken: string | null = null
			let expireDate: Date | null = null

			if (user.caxtonPassword) {
				const caxtonData = await caxtonUserLoginService(token, {
					userEmail: user.email,
					password: user.caxtonPassword,
					deviceId: '',
					device: '',
					operatingSystem: '',
				})

				if (caxtonData) {
					userAPIToken = caxtonData.userAPIToken
					expireDate = new Date(caxtonData.expireDate)
				}
			}

			return responseHandler({
				res,
				data: {
					email,
					token,
					userType: user!.userType,
					entityType: user!.entityType,
					userAPIToken,
					expireDate,
				},
				msg: Messages.LOGIN_SUCCESS,
			})
		}
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, data: { error } })
	}
}

export const updateUserKYB = async (req: Request, res: Response) => {
	Logger.info('Inside update User KYB controller')
	try {
		const validator = await updateUserKYBValidator(req.body)
		if (validator.error) {
			return errorHandler({ res, err: validator.message, statusCode: 400 })
		}

		const authToken = req.headers.authorization!

		const { id: userId, email } = req.user
		const {
			memorableWord: caxtonMemorableWord,
			primaryContactNo: primaryContactNo,
			product: caxtonProduct,
			caxtonPassword,
			companyName,
			companyRegistrationNumber,
			companyWebsite,
			state,
			countryCode,
			...defaultPayload
		}: {
			memorableWord: string
			primaryContactNo: string
			product: string
			caxtonPassword: string
		} & kybPayloadInterface = req.body

		const caxtonPayload: caxtonOnboardInterface = {
			memorableWord: caxtonMemorableWord,
			primaryContactNo: primaryContactNo,
			product: caxtonProduct,
			password: caxtonPassword,
			...defaultPayload,
			email,
			id: userId,
		}

		const encryptedPassword = await encryptCaxtonPassword(caxtonPassword)

		const { ApplicantId: caxtonApplicantId, Userid: caxtonUserId } = await caxtonUserOnboardService(
			authToken,
			caxtonPayload
		)

		const loginRes = await caxtonUserLoginService(authToken, {
			userEmail: email,
			password: encryptedPassword,
			deviceId: '',
			device: '',
			operatingSystem: '',
		})

		const { userAPIToken, expireDate, userAccountId, userRefCode } = loginRes

		const mobileNumber = defaultPayload.mobileNumber!
		const postalCode = defaultPayload.postcode!
		delete defaultPayload.mobileNumber
		delete defaultPayload.postcode

		const userUpdatePayload: any = {
			caxtonMemorableWord,
			primaryContactNo,
			caxtonProduct,
			caxtonApplicantId,
			caxtonUserId,
			caxtonPassword: encryptedPassword,
			caxtonReferralCode: userRefCode,
			caxtonPrimaryAccountId: userAccountId,
			mobileNumber: parseInt(mobileNumber),
			postalCode,
			...defaultPayload,
		}

		await updateUserService(userUpdatePayload, userId)

		return responseHandler({
			res,
			data: {
				userAPIToken,
				expireDate,
			},
			msg: Messages.KYB_UPDATE_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, err: Messages.INTERNAL_SERVER_ERROR, data: { error } })
	}
}
