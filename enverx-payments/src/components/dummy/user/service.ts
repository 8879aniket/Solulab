import { Logger } from '@config/logger'
import User from '@dummy/user/user.model'
import { UserInterface, BankDetailsInterface } from '@interfaces/user'
import BankAccount from '@dummy/user/bankDetails.model'
export const createUser = async (payload: UserInterface) => {
	Logger.info('Inside create User service')
	try {
		const user = await User.create(payload)
		return user
	} catch (error) {
		Logger.error(error)
	}
}

export const getUserService = async (
	filter: Partial<{
		email: string
		id: string
		userType: string
		mobileNumber: number
		countryCode: string
	}>
) => {
	Logger.info('Inside Get User Service')
	try {
		let error: boolean = false
		const user = await User.findOne({ where: filter })
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

export const updateUserService = async (payload: UserInterface, userId: string) => {
	Logger.info('Inside Update User Service')
	try {
		const userData = await User.findOne({
			where: {
				id: userId,
			},
		})
			.then((result) => {
				result!.update(payload, {
					where: {
						id: userId,
					},
				})
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

export const createBankAccount = async (payload: BankDetailsInterface) => {
	Logger.info('Inside dummy create bank account service')
	try {
		const data = await BankAccount.create(payload)
		return data
	} catch (err) {
		Logger.error(err)
		return null
	}
}

export const getUserByWalletAddress = async (walletAddress: string) => {
	Logger.info('Inside Get User By Wallet Address service')
	try {
		const userData = await User.findOne({ where: { blockchainWalletAddress: walletAddress } })
		if (!userData) {
			return false
		}
		return userData
	} catch (error) {
		Logger.error(error)
		return false
	}
}

export const getUserData = async (filter: any) => {
	try {
		const userData = await User.findOne({
			where: filter,
		})
		if (!userData) {
			return false
		}
		return userData
	} catch (err) {
		Logger.error(err)
		return false
	}
}
