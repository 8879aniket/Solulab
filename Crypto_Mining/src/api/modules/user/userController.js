import bcrypt from 'bcryptjs'
import countryList from 'country-list'
import qrCode from 'qrcode'
import speakeasy from 'speakeasy'
import mongoose from 'mongoose'
import logger from '../../middleware/logger'
import { handleResponse, handleError } from '../../config/requestHandler'
import config from '../../config/index'
import { userModel } from './userModel'
import ticket from './ticketModel'
import {
	checkEmailExist,
	addMinutesToDate,
	getRandomString,
} from './services/userService'
import { getAccessToken } from '../../middleware/auth'

import {
	sendConfirmationEmail,
	sendResetPasswordEmail,
	sendOtpEmail,
} from './services/emailService'
import { s3 } from '../../middleware/multerS3'

module.exports = {
	getCountryList: async (req, res) => {
		try {
			const countryData = countryList.getData()
			return handleResponse({ res, data: countryData })
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},

	checkEmailExist: async (req, res) => {
		try {
			const { email } = req.body
			if (!email) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Email ID not provided.',
				})
			}
			const emailCheck = await checkEmailExist(email)
			if (emailCheck) {
				return handleError({
					res,
					statusCode: 409,
					message: 'Email ID already exist.',
				})
			}
			return handleResponse({ res, msg: 'Email not registered.' })
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},

	postSignUp: async (req, res) => {
		try {
			// eslint-disable-next-line camelcase
			const { email, password, country, countryCode, first_name } =
				req.body
			if (!email) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Email not provided.',
				})
			}
			if (!password) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Password not provided.',
				})
			}
			if (!country) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Country not provided.',
				})
			}
			if (!countryCode) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Country code not provided.',
				})
			}
			// eslint-disable-next-line camelcase
			if (!first_name) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Name not provided.',
				})
			}
			const emailCheck = await checkEmailExist(email)
			if (emailCheck) {
				return handleError({
					res,
					statusCode: 409,
					message: 'Email ID already exist.',
				})
			}
			const confirmationCode = await getRandomString(50, 'confirmation')
			const recoveryCode = await getRandomString(20, 'recoverycode')

			const userObj = new userModel({
				email,
				password: bcrypt.hashSync(password, 8),
				country,
				country_code: countryCode,
				confirmation_code: confirmationCode,
				recovery_code: recoveryCode,
				// eslint-disable-next-line object-shorthand
				first_name: first_name,
			})

			userObj.save((err) => {
				if (err) {
					return handleError({ res, err })
				}
				sendConfirmationEmail(email, confirmationCode)
				return handleResponse({
					res,
					msg: 'User created.',
					data: {
						_id: userObj._id,
						is_email_verified: userObj.is_email_verified,
						is_2fa: userObj.is_2fa,
						email: userObj.email,
						recovery_code: userObj.recovery_code,
					},
				})
			})
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},

	sendVerificationEmail: async (req, res) => {
		try {
			const { email } = req.body
			if (!email) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Email not provided.',
				})
			}
			const emailCheck = await checkEmailExist(email)
			if (!emailCheck) {
				return handleError({
					res,
					statusCode: 404,
					message: 'User not found.',
				})
			}
			if (emailCheck.is_email_verified === true) {
				return handleError({
					res,
					statusCode: 409,
					message: 'Email ID already verified.',
				})
			}
			emailCheck.confirmation_code = await getRandomString(
				50,
				'confirmation'
			)
			emailCheck.save()
			sendConfirmationEmail(email, emailCheck.confirmation_code)
			return handleResponse({ res, msg: 'Email sent successfully.' })
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},

	verifyEmail: async (req, res) => {
		try {
			const { confirmationCode } = req.body
			if (!confirmationCode) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Confirmation code not provided.',
				})
			}
			const conditions = {
				confirmation_code: confirmationCode,
			}
			const userData = await userModel.findOne(conditions)
			if (!userData) {
				return handleError({
					res,
					statusCode: 404,
					message: 'Link has been expired.',
				})
			}
			if (userData.is_email_verified === true) {
				return handleError({
					res,
					statusCode: 409,
					message: 'Email ID already verified.',
				})
			}
			userData.is_email_verified = true
			userData.confirmation_code = undefined
			userData.save((err) => {
				if (err) {
					return handleError({ res, err })
				}
				return handleResponse({ res, msg: 'Email verified.' })
			})
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},

	checkEmailVerified: async (req, res) => {
		try {
			const { email } = req.body
			if (!email) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Email not provided.',
				})
			}
			const emailCheck = await checkEmailExist(email)
			if (!emailCheck) {
				return handleError({
					res,
					statusCode: 404,
					message: 'User not found.',
				})
			}
			if (emailCheck.is_email_verified === true) {
				return handleResponse({ res, msg: 'Email is verified.' })
			}
			return handleError({
				res,
				statusCode: 400,
				message: 'Email not verified.',
			})
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},

	signIn: async (req, res) => {
		try {
			// const match = await bcrypt.compare(password, user.passwordHash)?

			const user = await userModel.findOne(
				{ email: req.body.email },
				'_id email password auth_type is_2fa active recovery_code is_email_verified'
			)

			if (!user) {
				return res.status(400).send({
					status: 'error',
					message: 'Invalid email or password.',
				})
			}

			if (user.active === false) {
				return res.status(400).send({
					status: 'error',
					message: 'User is disabled by Admin',
				})
			}

			if (user) {
				const match = await bcrypt.compare(
					req.body.password,
					user.password
				)

				if (match) {
					if (
						user.is_2fa === false &&
						user.auth_type === 'NONE' &&
						user.is_email_verified === true
					) {
						const token = await getAccessToken(
							user._id,
							'user',
							req.body.rememberMe
						)
						delete user.password
						res.status(200).send({
							status: 'success',
							data: {
								_id: user._id,
								is_email_verified: user.is_email_verified,
								is_2fa: user.is_2fa,
								email: user.email,
								recovery_code: user.recovery_code,
								token,
								auth_type: user.auth_type,
							},
						})
					}

					if (
						user.is_2fa &&
						user.auth_type === 'EMAIL' &&
						user.is_email_verified === true
					) {
						const otpCode = await Math.floor(
							100000 + Math.random() * 900000
						)
						const now = new Date()
						const expirationTime = await addMinutesToDate(now, 10)

						user.otp = otpCode
						user.otp_expiration_time = expirationTime
						user.save()
						await sendOtpEmail(user.email, otpCode, '2FA')
						res.status(200).send({
							status: 'success',
							message: '2fa-Email.',
							data: {
								_id: user._id,
								is_email_verified: user.is_email_verified,
								is_2fa: user.is_2fa,
								auth_type: user.auth_type,
								email: user.email,
								recovery_code: user.recovery_code,
							},
						})
					}

					if (
						user.is_2fa &&
						user.auth_type === 'AUTHENTICATOR' &&
						user.is_email_verified === true
					) {
						res.status(200).send({
							status: 'success',
							message: '2fa-Authenticator.',
							data: {
								_id: user._id,
								is_email_verified: user.is_email_verified,
								is_2fa: user.is_2fa,
								auth_type: user.auth_type,
								email: user.email,
								recovery_code: user.recovery_code,
							},
						})
					}
					res.status(200).send({
						status: 'success',
						data: {
							_id: user._id,
							is_email_verified: user.is_email_verified,
							is_2fa: user.is_2fa,
							auth_type: user.auth_type,
							email: user.email,
							recovery_code: user.recovery_code,
						},
					})
				} else {
					return res.status(400).send({
						status: 'error',
						message: 'Invalid email or password.',
					})
				}
			}
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	sendOtpToMail: async (req, res) => {
		try {
			const { email, type } = req.body
			const typeArray = ['VERIFICATION', '2FA']
			if (!email) {
				return handleError({
					res,
					statusCode: 400,
					message: 'email not provided',
				})
			}
			if (!type) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Type not provided.',
				})
			}
			if (!typeArray.includes(type)) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Type should be VERIFICATION or 2FA.',
				})
			}
			const user = await checkEmailExist(email)
			if (!user) {
				return handleError({
					res,
					statusCode: 404,
					message: 'User not found.',
				})
			}
			if (user.is_email_verified === false) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Email not verified.',
				})
			}

			const otpCode = await Math.floor(100000 + Math.random() * 900000)
			const now = new Date()
			const expirationTime = await addMinutesToDate(now, 10)

			user.otp = otpCode
			user.otp_expiration_time = expirationTime

			user.save()

			await sendOtpEmail(email, otpCode, type)

			return handleResponse({ res, msg: 'OTP sent.' })
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},

	verifyOtp: async (req, res) => {
		try {
			const { otp, email, varificationType, rememberMe } = req.body
			const currentdate = new Date()
			if (!otp) {
				return handleError({
					res,
					statusCode: 400,
					message: 'OTP not provided.',
				})
			}
			if (!email) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Email not provided.',
				})
			}
			const user = await checkEmailExist(email)
			if (!user) {
				return handleError({
					res,
					statusCode: 404,
					message: 'User not found.',
				})
			}
			if (user.is_email_verified === false) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Email not verified.',
				})
			}

			const otpInstance = await userModel.findOne({ email })
			if (otpInstance != null) {
				if (otpInstance.otp) {
					if (otpInstance.otp_expiration_time > currentdate) {
						if (otp === otpInstance.otp) {
							otpInstance.otp = undefined
							otpInstance.otp_expiration_time = undefined
							otpInstance.save()

							if (varificationType === 'login') {
								const token = await getAccessToken(
									otpInstance._id,
									'user',
									rememberMe
								)
								return res.status(200).send({
									status: 'success',
									data: {
										_id: otpInstance._id,
										is_email_verified:
											otpInstance.is_email_verified,
										is_2fa: otpInstance.is_2fa,
										email: otpInstance.email,
										recovery_code:
											otpInstance.recovery_code,
										token,
									},
								})
							}
							return handleResponse({
								res,
								msg: 'OTP verified.',
							})
						}
						return handleError({
							res,
							statusCode: 400,
							message: 'OTP invalid.',
						})
					}
					return handleError({
						res,
						statusCode: 400,
						message: 'OTP expired.',
					})
				}
				return handleError({
					res,
					statusCode: 400,
					message: 'OTP either used or not generated.',
				})
			}
			return handleError({
				res,
				statusCode: 404,
				message: 'User not found.',
			})
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},

	post2Fa: async (req, res) => {
		try {
			const { email, authType } = req.body
			let is2Fa = true
			const authTypeArr = ['AUTHENTICATOR', 'EMAIL', 'NONE']
			if (!email) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Email not provided.',
				})
			}
			if (!authType) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Auth type not provided.',
				})
			}
			if (!authTypeArr.includes(authType)) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Auth type is invalid.',
				})
			}
			const user = await checkEmailExist(email)
			if (!user) {
				return handleError({
					res,
					statusCode: 404,
					message: 'User not found.',
				})
			}
			if (user.is_email_verified === false) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Email not verified.',
				})
			}
			if (authType === 'NONE') {
				is2Fa = false
			}
			user.is_2fa = is2Fa
			user.auth_type = authType
			user.save()

			return handleResponse({ res })
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},

	generateQrCodeAndSecret: async (req, res) => {
		try {
			const { email } = req.body
			if (!email) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Email not provided.',
				})
			}
			const user = await checkEmailExist(email)
			if (!user) {
				return handleError({
					res,
					statusCode: 404,
					message: 'User not found.',
				})
			}
			if (user.is_email_verified === false) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Email not verified.',
				})
			}

			const secret = speakeasy.generateSecret({ length: 15 })
			const otpAuthUrl = speakeasy.otpauthURL({
				secret: secret.base32,
				label: `${config.appName}(${email})`,
			})

			qrCode.toDataURL(otpAuthUrl, (err, imageData) => {
				if (err) {
					return handleError({ res, err })
				}
				user.secret_key = secret.base32
				user.save()

				return handleResponse({
					res,
					data: { secret: secret.base32, secretUri: imageData },
				})
			})
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},

	verifySecret: async (req, res) => {
		try {
			const { email, token, varificationType, rememberMe } = req.body
			const userData = await userModel.findOne({ email })
			if (!token) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Token not provided.',
				})
			}
			if (!email) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Email not provided.',
				})
			}
			const user = await checkEmailExist(email)
			if (!user) {
				return handleError({
					res,
					statusCode: 404,
					message: 'User not found.',
				})
			}
			if (user.is_email_verified === false) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Email not verified.',
				})
			}

			const base32secret = user.secret_key
			const verified = speakeasy.totp.verifyDelta({
				secret: base32secret,
				token,
			})

			if (!verified) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Incorrect verification code.',
				})
			}
			if (varificationType === 'login') {
				const userToken = await getAccessToken(
					userData._id,
					'user',
					rememberMe
				)
				return res.status(200).send({
					status: 'success',
					data: {
						_id: userData._id,
						is_email_verified: userData.is_email_verified,
						is_2fa: userData.is_2fa,
						email: userData.email,
						recovery_code: userData.recovery_code,
						token: userToken,
					},
				})
			}
			return handleResponse({ res, msg: 'Token verified.' })
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},

	getRecoveryCode: async (req, res) => {
		try {
			const { email } = req.body
			if (!email) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Email not provided.',
				})
			}
			const user = await checkEmailExist(email)
			if (!user) {
				return handleError({
					res,
					statusCode: 404,
					message: 'User not found.',
				})
			}
			if (user.is_email_verified === false) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Email not verified.',
				})
			}

			return handleResponse({
				res,
				data: { recoveryCode: user.recovery_code },
			})
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},

	sendResetPasswordMail: async (req, res) => {
		try {
			const { email } = req.body
			if (!email) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Email not provided.',
				})
			}
			const user = await checkEmailExist(email)
			if (!user) {
				return handleError({
					res,
					statusCode: 404,
					message: 'User not found.',
				})
			}

			const token = await getRandomString(50, 'Reset password.')
			const now = new Date()
			const expirationTime = await addMinutesToDate(now, 15)

			user.reset_password_code = token
			user.reset_password_expires = expirationTime
			user.save()

			sendResetPasswordEmail(email, token)
			return handleResponse({ res, msg: 'Email sent successfully.' })
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},

	reset: async (req, res) => {
		try {
			const { resetPasswordCode } = req.body
			if (!resetPasswordCode) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Reset password code not provided.',
				})
			}
			const conditions = {
				reset_password_code: resetPasswordCode,
				reset_password_expires: { $gt: Date.now() },
			}
			const userData = await userModel.findOne(conditions)
			if (!userData) {
				return handleError({
					res,
					statusCode: 404,
					message: 'Reset password code is invalid or has expired.',
				})
			}
			return handleResponse({ res })
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},

	resetPassword: async (req, res) => {
		try {
			const { password, resetPasswordCode } = req.body
			if (!password) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Password not provided.',
				})
			}
			if (!resetPasswordCode) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Reset password code not provided.',
				})
			}
			const conditions = {
				reset_password_code: resetPasswordCode,
				reset_password_expires: { $gt: Date.now() },
			}
			const userData = await userModel.findOne(conditions)
			if (!userData) {
				return handleError({
					res,
					statusCode: 404,
					message: 'Reset password code is invalid or has expired.',
				})
			}
			userData.password = bcrypt.hashSync(password, 8)
			userData.reset_password_code = undefined
			userData.reset_password_expires = undefined
			userData.save((err) => {
				if (err) {
					return handleError({ res, err })
				}
				return handleResponse({ res, msg: 'Password changed.' })
			})
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},

	getProfile: async (req, res) => {
		try {
			const user = await userModel
				.findById(req.userId)
				.select([
					'email',
					'first_name',
					'last_name',
					'image',
					'country',
					'country_code',
				])
			if (!user) {
				return handleError({
					res,
					statusCode: 404,
					message: 'User not found.',
				})
			}

			return handleResponse({ res, data: user })
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},

	removeProfileImage: async (req, res) => {
		try {
			const user = await userModel.findById(req.userId)
			if (!user) {
				return handleError({
					res,
					statusCode: 404,
					message: 'User not found.',
				})
			}

			// remove image from s3
			if (user.image) {
				const imageName = user.image.split('/').pop()
				s3.deleteObject(
					{
						Bucket: config.s3Credentials.bucket,
						Key: `profile-images/${imageName}`,
					},
					(err) => {
						if (err) logger.error(err)
					}
				)
			}
			user.image = undefined
			user.save((err) => {
				if (err) {
					return handleError({ res, err })
				}
				return handleResponse({ res, msg: 'Profile image removed.' })
			})
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},

	postProfile: async (req, res) => {
		try {
			const { firstName, lastName, email } = req.body
			let emailFlag = false
			let token = ''
			if (req.file_error) {
				return handleError({ res, message: req.file_error })
			}
			const user = await userModel.findById(req.userId)
			if (!user) {
				return handleError({
					res,
					statusCode: 404,
					message: 'User not found.',
				})
			}
			if (firstName) {
				user.first_name = firstName
			}
			if (lastName) {
				user.last_name = lastName
			}
			if (email && email !== user.email) {
				const emailExists = await userModel.findOne({
					email,
					_id: { $ne: req.userId },
				})
				if (emailExists) {
					return handleError({
						res,
						statusCode: 400,
						message: 'Email ID already used.',
					})
				}
				emailFlag = true
				token = await getRandomString(50, 'Confirmation.')
				user.email = email
				user.is_email_verified = false
				user.confirmation_code = token
			}
			if (req.file) {
				if (user.image) {
					const imageName = user.image.split('/').pop()
					s3.deleteObject(
						{
							Bucket: config.s3Credentials.bucket,
							Key: `profile-images/${imageName}`,
						},
						(err) => {
							if (err) logger.error(err)
						}
					)
				}
				user.image = req.file.location
			}
			user.save((err) => {
				if (err) {
					return handleError({ res, err })
				}
				let responseMsg = 'User updated.'
				let newEmail
				if (emailFlag) {
					newEmail = email
					responseMsg =
						'User updated and verification link sent to the new email.'
					sendConfirmationEmail(email, token)
				}
				return handleResponse({
					res,
					msg: responseMsg,
					data: { newEmail },
				})
			})
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},

	updatePassword: async (req, res) => {
		try {
			const { oldPassword, newPassword } = req.body
			if (!oldPassword) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Old password not provided.',
				})
			}
			if (!newPassword) {
				return handleError({
					res,
					statusCode: 400,
					message: 'New password not provided.',
				})
			}
			const user = await userModel.findById(req.userId)
			if (!user) {
				return handleError({
					res,
					statusCode: 404,
					message: 'User not found.',
				})
			}
			const match = await bcrypt.compare(oldPassword, user.password)
			if (!match) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Invalid old password.',
				})
			}

			const newMatch = await bcrypt.compare(newPassword, user.password)
			if (newMatch) {
				return handleError({
					res,
					statusCode: 400,
					message: 'New password cannot be same as old password.',
				})
			}

			user.password = bcrypt.hashSync(newPassword, 8)
			user.save((err) => {
				if (err) {
					return handleError({ res, err })
				}
				return handleResponse({ res, msg: 'Password updated.' })
			})
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},

	createTicket: async (req, res) => {
		try {
			const { ticketId, createdAt } = req.body
			if (createdAt === undefined || ticketId === undefined) {
				return handleError({
					res,
					statusCode: 400,
					message: 'TicketId and CreatedAt required.',
				})
			}
			const ticketData = await ticket.create({
				userId: mongoose.Types.ObjectId(req.userId),
				ticketId,
				createdAt,
			})
			if (!ticketData) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Something went wrong.',
				})
			}
			return handleResponse({
				res,
				msg: `Ticket created successfully.`,
				data: ticketData,
			})
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},

	getUserTicket: async (req, res) => {
		try {
			const { userId } = req
			const ticketData = await ticket.find({ userId })
			return handleResponse({
				res,
				msg: `Ticket fetched successfully.`,
				data: ticketData,
			})
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},
}
