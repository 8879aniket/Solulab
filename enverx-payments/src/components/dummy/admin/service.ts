import { Logger } from '@config/logger'
import Admin from '@dummy/admin/admin.model'
import { AdminInterface } from '@interfaces/admin'

export const createAdminService = async (payload: AdminInterface) => {
	Logger.info('Inside create User service')
	try {
		const user = await Admin.create(payload)
		return user
	} catch (error) {
		Logger.error(error)
	}
}

export const getAdminService = async (
	filter: Partial<{
		email: string
		id: string
		userType: string
		mobileNumber: number
		countryCode: string
	}>
) => {
	Logger.info('Inside Get Admin Service')
	try {
		let error: boolean = false
		const user = await Admin.findOne({ where: filter })
		if (!user) {
			error = true
			return null
		} else {
			return user
		}
	} catch (err) {
		Logger.error(err)
		return null
	}
}

export const updateAdminService = async (payload: AdminInterface, userId: string) => {
	Logger.info('Inside Update Admin Service')
	try {
		const {
			id,
			name,
			email,
			mobileNumber,
			countryCode,
			password,
			twoFAStatus,
			twoFAType,
			otpCode,
			accountType,
			role,
			firstTimeLogin,
			isActive,
			profilePic,
			walletId,
			walletType,
			walletDescription,
			venlyPinCode,
			blockchainWalletId,
			blockchainWalletAddress,
			blockchainWalletDescription,
			blockchainSecretType,
			blockchainWalletType,
			blockchainWalletIdentifier,
			otpLimit,
			otpBlockTime,
			otpExpire,
			isOTPBlocked,
			passwordResetToken,
			passwordResetExpired,
			loginAttempt,
			loginBlockedTime,
			isLoginBlocked,
			incorrectOtpAttempt,
			forgotPasswordLimit,
			forgotPasswordBlockTime,
			linkSentBlocked,
		} = payload
		const userData = await Admin.findOne({
			where: {
				id: userId,
			},
		})
			.then((result) => {
				result!.update(
					{
						id,
						name,
						email,
						mobileNumber,
						countryCode,
						password,
						twoFAStatus,
						twoFAType,
						otpCode,
						accountType,
						role,
						firstTimeLogin,
						isActive,
						profilePic,
						walletId,
						walletType,
						walletDescription,
						venlyPinCode,
						blockchainWalletId,
						blockchainWalletAddress,
						blockchainWalletDescription,
						blockchainSecretType,
						blockchainWalletType,
						blockchainWalletIdentifier,
						otpLimit,
						otpBlockTime,
						otpExpire,
						isOTPBlocked,
						passwordResetToken,
						passwordResetExpired,
						loginAttempt,
						loginBlockedTime,
						isLoginBlocked,
						incorrectOtpAttempt,
						forgotPasswordLimit,
						forgotPasswordBlockTime,
						linkSentBlocked,
					},
					{
						where: {
							id: userId,
						},
					}
				)
			})
			.catch((error) => {
				Logger.error(error)
				return null
			})

		return userData
	} catch (err) {
		Logger.error(err)
		return null
	}
}
