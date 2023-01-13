import bcrypt from 'bcrypt'
import { Logger } from '@config/logger'
import { UserInterface, BankDetailsInterfacte } from '@interfaces/user'
import { caxtonLoginInterface, caxtonOnboardInterface } from '@interfaces/caxton'
import User from '@user/user.model'
import BankDetails from './bankDetails.model'
import { Op } from 'sequelize'
import crypto from 'crypto'
import Config from '@config/config'
import axios from 'axios'
import { Request } from 'express'

export const createUser = async (payload: UserInterface, email: string) => {
	Logger.info('Inside create User service')
	try {
		const isExist = await User.findOne({ where: { email: payload.email } })
		if (email !== '') {
			if (isExist && isExist.emailVerified) {
				return false
			}
			const oldUser = await User.findOne({ where: { email } })
				.then((result) => {
					if (!result) {
						return null
					}
					if (result?.emailVerified) {
						return false
					}
					result?.update(payload, {
						where: {
							email,
							emailVerified: false,
						},
					})
					return result
				})
				.catch((err) => {
					return null
				})
			return oldUser
		}

		if (isExist) {
			if (isExist.userType === 'ECHOSUBSCRIBER') {
				const { id, email, ...userData } = payload

				const user = await User.update(userData, {
					where: {
						id: isExist.id,
					},
					returning: true,
					individualHooks: true,
				})

				return user[1][0].get({ plain: true })
			} else {
				return false
			}
		}
		const user = await User.create(payload)
		return user
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const generateOTP = async (length: number): Promise<number> => {
	Logger.info('Inside Generate Otp Service')
	try {
		let result = ''
		const characters = '0123456789'
		const charactersLength = length
		for (let i = 0; i < length; i++) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength))
		}
		return parseInt(result)
	} catch (err) {
		Logger.error(err)
		return 0
	}
}

export const getUserService = async (filter: Partial<UserInterface>) => {
	Logger.info('Inside Get User Service')
	try {
		const user = await User.findOne({ where: filter })
		if (!user) {
			return null
		}
		return user
	} catch (err) {
		Logger.error(err)
		return null
	}
}

export const verifyPassword = async (
	enteredPassword: string,
	storedPassword: string
): Promise<boolean> => {
	Logger.info('Inside Verify password Service')
	try {
		return await bcrypt.compare(enteredPassword, storedPassword)
	} catch (err) {
		Logger.error(err)
		return false
	}
}

export const updateOTPService = async (otpCode: any, email: string) => {
	Logger.info('Inside update OTP Service')
	try {
		const userData = await User.findOne({
			where: {
				email,
			},
		})
			.then((result) => {
				result!.update(
					{ otpCode, otpLimit: 5, isOTPBlocked: false },
					{
						where: {
							email,
						},
					}
				)
			})
			.catch((error) => {
				return null
			})

		return userData
	} catch (error) {
		Logger.error(error)
		return null
	}
}

export const saveUserOTP = async (
	mobileNumber: number,
	countryCode: string,
	email: string,
	otpCode: number
) => {
	Logger.info('Inside Save User Otp Service')
	try {
		const userData = await User.findOne({
			where: {
				email,
			},
		})
			.then((result) => {
				result?.decrement('otpLimit')
				result!.update(
					{
						otpCode,
						otpExpire: new Date(new Date().getTime() + 60000 * 2),
						incorrectOtpAttempt: 3,
					},
					{
						where: {
							email,
						},
					}
				)
			})
			.catch((error) => {
				return null
			})

		return userData
	} catch (err) {
		Logger.error(err)
		return null
	}
}

export const saveMobileOTP = async (
	mobileNumber: number,
	countryCode: string,
	email: string,
	otpCode: number
) => {
	Logger.info('Inside Save User Otp Service')
	try {
		const userData = await User.findOne({
			where: {
				email,
			},
		})
			.then((result) => {
				result?.decrement('otpMobileLimit')
				result!.update(
					{
						otpCode,
						otpExpire: new Date(new Date().getTime() + 60000 * 2),
						incorrectOtpAttempt: 3,
					},
					{
						where: {
							email,
						},
					}
				)
			})
			.catch((error) => {
				return null
			})

		return userData
	} catch (err) {
		Logger.error(err)
		return null
	}
}

export const createPasswordResetToken = async (email: string) => {
	Logger.info('Inside create Password Reset Token Service')
	try {
		const resetToken = crypto.randomBytes(32).toString('hex')

		const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')
		const passwordResetExpired = new Date(Date.now() + 10 * 60 * 1000)
		const userData = await User.findOne({
			where: {
				email,
			},
		})
			.then((result) => {
				result!.update(
					{
						passwordResetToken,
						passwordResetExpired,
						forgotPasswordLimit: result?.forgotPasswordLimit! - 1,
					},
					{
						where: {
							email,
						},
					}
				)
			})
			.catch((error) => {
				return null
			})
		return resetToken
	} catch (error) {
		return null
	}
}

export const resetPasswordService = async (password: string, resetToken: string) => {
	Logger.info('Inside Reset Password Service')
	try {
		const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')

		const userData = await User.findOne({
			where: {
				passwordResetToken,
				passwordResetExpired: {
					[Op.gte]: new Date(Date.now()),
				},
			},
		})
			.then(async (result) => {
				if (await bcrypt.compare(password, result!.password)) {
					return false
				}
				const hashPassword = await bcrypt.hash(password, 10)
				result!.update(
					{
						password: hashPassword,
						passwordResetExpired: new Date(),
						passwordChangedAt: new Date(),
						passwordChangeByUserTokenCreatedAt: null!,
					},
					{
						where: {
							passwordResetToken,
						},
					}
				)
			})
			.catch((error) => {
				return null
			})

		return userData
	} catch (error) {
		Logger.error(error)
		return null
	}
}

export const updateUserService = async (data: Partial<UserInterface>, id: string) => {
	Logger.info('Inside update user Service')
	try {
		const userData = await User.findOne({
			where: {
				id,
			},
		})
			.then((result) => {
				if (data.kycStatus === 'APPROVED') {
					data.isPurchaser = true
				}
				result!.update(data, {
					where: {
						id,
					},
				})
			})
			.catch((error) => {
				return null
			})

		return userData
	} catch (error) {
		Logger.error(error)
		return null
	}
}

export const getAllUserService = async (
	offset: number,
	limit: number,
	searchTxt: string,
	orderBy: string,
	orderType: string,
	usertype: string,
	kycstatus: string,
	Country: string,
	userstatus: string,
	entitytype: string
) => {
	Logger.info('Inside Get all user service')
	try {
		let options: any = {
			offset,
			limit,
			where: {
				accountType: 'USER',
			},
			order: [[orderBy, orderType]],
		}

		if (searchTxt !== '') {
			options.where = {
				accountType: 'USER',
				[Op.or]: {
					name: {
						[Op.iLike]: `%${searchTxt}%`,
					},
					email: {
						[Op.iLike]: `%${searchTxt}%`,
					},
					companyName: {
						[Op.iLike]: `%${searchTxt}%`,
					},
				},
			}
		}

		if (entitytype !== '') {
			options.where.entityType = entitytype
		}

		if (usertype !== '') {
			options.where.userType = usertype
		}

		if (kycstatus !== '') {
			options.where.kycStatus = kycstatus
		}
		if (Country !== '') {
			options.where.country = Country
		}

		if (userstatus !== '') {
			if (userstatus === 'BLOCKED') {
				options.where.isBlocked = true
			} else if (userstatus === 'PURCHASER') {
				options.where.isPurchaser = true
			} else {
				options.where.isPurchaser = false
			}
		}
		const listUser = await User.findAndCountAll(options)
		return listUser
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}

export const createBankAccountService = async (payload: BankDetailsInterfacte) => {
	Logger.info('Inside create Bank Account service')
	try {
		const BankData = await BankDetails.create(payload)
		return BankData
	} catch (error) {
		Logger.error(error)
	}
}

export const updateBankAcccountService = async (
	id: string,
	status: string,
	trackingRef: string
) => {
	Logger.info('Inside Update Bank Account service')
	try {
		const bankData = await BankDetails.findOne({
			where: {
				account_id: id,
				tracking_ref: trackingRef,
			},
		})
			.then((result) => {
				result!.update(
					{
						status,
					},
					{
						where: {
							account_id: id,
							tracking_ref: trackingRef,
						},
					}
				)
			})
			.catch((error) => {
				Logger.error(error)
				return null
			})

		return bankData
	} catch (error) {
		Logger.error(error)
	}
}

export const getBankAccountService = async (userId: string, type: string) => {
	Logger.info('Inside Get Bank Account service')
	try {
		const bankAccountList = await BankDetails.findAll({
			where: { userId, is_disposed: false, type_of_account: type },
		})
		return bankAccountList
	} catch (error) {
		Logger.error(error)
	}
}

export const addWalletId = async (
	id: string,
	walletId: string,
	description: string,
	type: string
) => {
	Logger.info('Inside Add Wallet Service')
	try {
		const userData = await User.findOne({
			where: {
				id,
			},
		})
			.then((result) => {
				result!.update(
					{
						walletId,
						walletType: type,
						walletDescription: description,
					},
					{
						where: {
							id,
						},
					}
				)
			})
			.catch((error) => {
				Logger.error(error)
				return null
			})
		return userData
	} catch (error) {
		Logger.error(error)
		return null
	}
}

export const updateACHBankAcccountService = async (
	accountId: string,
	status: string,
	accountNumber: string,
	routingNumber: string,
	description: string,
	bankName: string,
	line1: string,
	city: string,
	district: string,
	country: string,
	fingerprint: string
) => {
	Logger.info('Inside Update ACH Bank Account service')
	try {
		const bankData = await BankDetails.findOne({
			where: {
				account_id: accountId,
			},
		})
			.then((result) => {
				result!.update(
					{
						status,
						account_number: accountNumber,
						routing_number: routingNumber,
						description,
						bank_name: bankName,
						bank_line1: line1,
						bank_city: city,
						bank_district: district,
						bank_country: country,
						fingerprint,
					},
					{
						where: {
							account_id: accountId,
						},
					}
				)
			})
			.catch((error) => {
				Logger.error(error)
				return null
			})

		return bankData
	} catch (error) {
		Logger.error(error)
	}
}

export const deleteBankAcccountService = async (id: string) => {
	Logger.info('Inside Delete Bank Account service')
	try {
		const bankData = await BankDetails.findOne({
			where: {
				account_id: id,
			},
		})
			.then((result) => {
				result!.update(
					{
						is_disposed: true,
					},
					{
						where: {
							account_id: id,
						},
					}
				)
			})
			.catch((error) => {
				Logger.error(error)
				return null
			})

		return bankData
	} catch (error) {
		Logger.error(error)
	}
}

export const getBankAccountByIdService = async (accountId: string) => {
	Logger.info('Inside Get Bank Account By Id service')
	try {
		const bankAccountList = await BankDetails.findOne({ where: { account_id: accountId } })
		return bankAccountList
	} catch (error) {
		Logger.error(error)
	}
}

export const getBlockchainDetailsService = async (userId: string) => {
	Logger.info('Inside Get Blockchain Details service')
	try {
		const blockchainData = await User.findByPk(userId)
		return blockchainData
	} catch (error) {
		Logger.error(error)
	}
}

export const getEchoUsersService = async (
	offset: number,
	limit: number,
	searchTxt: string | undefined,
	orderBy: string | undefined = 'echoEndDate',
	orderType: string | undefined = 'ASC'
) => {
	Logger.info('Inside Get Echo users service')
	try {
		let options: any = {
			offset,
			limit,
			where: {
				userType: {
					[Op.in]: ['INVESTOR', 'ECHOSUBSCRIBER'],
				},
				isEchoBlocked: false,
			},
			attributes: [
				'id',
				'email',
				'companyName',
				'echoStartDate',
				'echoEndDate',
				'isEchoSubscribed',
				'isEchoBlocked',
				'priceLastUpdatedAt',
			],
			order: [[orderBy, orderType]],
		}

		if (searchTxt)
			options.where[Op.or] = {
				companyName: {
					[Op.iLike]: `%${searchTxt}%`,
				},
				email: {
					[Op.iLike]: `%${searchTxt}%`,
				},
			}

		return await User.findAndCountAll(options)
	} catch (error) {
		Logger.error(error)
		throw { error }
	}
}

export const getEchoUserService = async (userId: string) => {
	Logger.info('Inside Get Echo User Service')
	try {
		const user = await User.findOne({
			where: {
				id: userId,
				isEchoBlocked: false,
			},
			attributes: ['id'],
		})
		return user
	} catch (err) {
		Logger.error(err)
		throw err
	}
}

export const updateEchoUserService = async (payload: Partial<UserInterface>, filter: any) => {
	Logger.info('Inside update Echo User Service')
	try {
		const data = await User.update(payload, {
			where: {
				...filter,
				userType: {
					[Op.in]: ['ECHOSUBSCRIBER', 'INVESTOR'],
				},
			},
			returning: true,
			individualHooks: true,
		})
		return data[0]
	} catch (err) {
		throw err
	}
}

export const getEchoSubscriberCountService = async () => {
	Logger.info('Inside get Echo Subscriber Count service')
	try {
		const count = await User.count({
			where: {
				isEchoSubscribed: true,
			},
		})
		return {
			count,
		}
	} catch (error) {
		Logger.error(error)
		throw { error }
	}
}

export const checkPassword = async (
	enteredPassword: string,
	storedPassword: string
): Promise<boolean> => {
	Logger.info('Inside Check password Service')
	try {
		return await bcrypt.compare(enteredPassword, storedPassword)
	} catch (err) {
		Logger.error(err)
		return false
	}
}

export const createPasswordService = async (
	password: string,
	email: string,
	passwordChangeByUserTokenCreatedAt: Date
) => {
	Logger.info('Inside Create Password Service')
	try {
		const userData = await User.findOne({
			where: {
				email,
			},
		})
			.then((result) => {
				result!.update(
					{ password, passwordChangedAt: new Date(), passwordChangeByUserTokenCreatedAt },
					{
						where: {
							email,
						},
					}
				)
			})
			.catch((error) => {
				return null
			})

		return userData
	} catch (error) {
		Logger.error(error)
		return null
	}
}

export const createEchoUserService = async (payload: UserInterface) => {
	Logger.info('Inside create Echo User Service')
	try {
		return await User.create(payload)
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const updateEchoSubscription = async (
	payload: {
		isEchoSubscribed: boolean
	},
	filter: { echoStartDate: Date } | { echoEndDate: Date }
) => {
	Logger.info('Inside start EchoSubscription ')
	try {
		await User.update(payload, {
			where: filter,
		})
	} catch (error) {
		Logger.error(error)
	}
}

export const createNewUserService = async (payload: UserInterface) => {
	Logger.info('Inside create NewUser Service')
	try {
		return await User.create(payload)
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const GenerateRandomStringOfLength = (length: number) => {
	try {
		let result = ''
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
		const charactersLength = characters.length
		for (let i = 0; i < length; i++) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength))
		}
		return result
	} catch (err) {
		Logger.error(err)
	}
}

export const caxtonUserOnboardService = async (
	authToken: string,
	userPayload: caxtonOnboardInterface
) => {
	Logger.info('Inside caxton User Onboard Service')
	try {
		const response: any = await axios.post(
			`${Config.PAYMENT.CAXTON.USER_ONBOARDING}`,
			userPayload,
			{
				headers: {
					authorization: authToken,
				},
			}
		)

		return response.data.data.user
	} catch (err) {
		Logger.error(err)
		throw err
	}
}

export const caxtonUserLoginService = async (
	authToken: string,
	payload: caxtonLoginInterface
): Promise<{
	userAPIToken: string
	expireDate: string
	userAccountId: string
	userRefCode: string
}> => {
	Logger.info('Inside caxton User Login Service')
	try {
		const response: any = await axios.post(`${Config.PAYMENT.CAXTON.USER_LOGIN}`, payload, {
			headers: {
				authorization: authToken,
			},
		})
		return response.data.data.userTokenResponse
	} catch (err) {
		Logger.error(err)
		throw err
	}
}
