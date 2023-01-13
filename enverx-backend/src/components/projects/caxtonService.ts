import Config from '@config/config'
import { Logger } from '@config/logger'
import {
	CreateCurrencyPotInterface,
	AccountTransferInterface,
	CurrencyPotBalanceInterface,
	MainPotBalanceInterface,
	PotBalanceResponseInterface,
	PotTransferInterface,
	GetAllCurrencyPotBalance,
} from '@interfaces/caxton'
import axios from 'axios'

export const createCurrencyPotService = async (
	payload: CreateCurrencyPotInterface,
	authToken: string
): Promise<null | PotBalanceResponseInterface> => {
	Logger.info('inside create Currency Pot Service')
	try {
		const response: any = await axios.post(
			`${Config.PAYMENT.CAXTON.CREATE_CURRENCY_POT}`,
			payload,
			{
				headers: {
					authorization: authToken,
				},
			}
		)

		const potData = response.data.data?.responseObject.Balances[0]

		if (!potData) return null

		const { Balance, CcyCode, BaseCcyCode, Description, NumericCode, AlphabeticCode, Symbol } =
			potData

		const { expireDate: caxtonExpireDate, userAPIToken: caxtonUserApiToken } =
			response.data.data.userObj

		return {
			Balance,
			CcyCode,
			BaseCcyCode,
			Description,
			NumericCode,
			AlphabeticCode,
			Symbol,
			caxtonExpireDate,
			caxtonUserApiToken,
		}
	} catch (err) {
		Logger.error(err)
		throw err
	}
}

export const getMainPotBalance = async (
	payload: MainPotBalanceInterface,
	authToken: string
): Promise<null | PotBalanceResponseInterface> => {
	Logger.info('inside get MainPot Balance Service ')
	try {
		let errorMessage
		let errorStatus
		const response: any = await axios
			.post(`${Config.PAYMENT.CAXTON.GET_MAIN_POT_BALANCE}`, payload, {
				headers: {
					authorization: authToken,
				},
			})
			.catch((error) => {
				errorMessage = error.response.data.msg
				errorStatus = error.response.status
			})
		if (!errorStatus) {
			const { Balance, CcyCode, BaseCcyCode, Description, NumericCode, AlphabeticCode, Symbol } =
				response.data.data.responseObject

			const { expireDate: caxtonExpireDate, userAPIToken: caxtonUserApiToken } =
				response.data.data.userObj

			return {
				Balance,
				CcyCode,
				BaseCcyCode,
				Description,
				NumericCode,
				AlphabeticCode,
				Symbol,
				caxtonExpireDate,
				caxtonUserApiToken,
			}
		} else {
			return null
		}
	} catch (err) {
		Logger.error(err)
		throw err
	}
}

export const getCurrencyPotBalance = async (
	payload: CurrencyPotBalanceInterface,
	authToken: string
): Promise<null | PotBalanceResponseInterface> => {
	Logger.info('inside get Currency Pot Balance Service')
	try {
		let errorMessage
		let errorStatus
		const response: any = await axios
			.post(`${Config.PAYMENT.CAXTON.GET_CURRENCY_POT_BALANCE}`, payload, {
				headers: {
					authorization: authToken,
				},
			})
			.catch((error) => {
				errorMessage = error.response.data.msg
				errorStatus = error.response.status
			})
		if (!errorStatus) {
			const { Balance, CcyCode, BaseCcyCode, Description, NumericCode, AlphabeticCode, Symbol } =
				response.data.data.responseObject

			if (!Balance) return null

			const { expireDate: caxtonExpireDate, userAPIToken: caxtonUserApiToken } =
				response.data.data.userObj

			return {
				Balance,
				CcyCode,
				BaseCcyCode,
				Description,
				NumericCode,
				AlphabeticCode,
				Symbol,
				caxtonExpireDate,
				caxtonUserApiToken,
			}
		} else {
			return null
		}
	} catch (err) {
		Logger.error(err)
		throw {
			msg: 'Caxton Service Error',
		}
	}
}

export const getAllCurrencyPotBalance = async (
	payload: GetAllCurrencyPotBalance,
	authToken: string
) => {
	let balanceArray: any
	let errorMessage
	let errorStatus
	Logger.info('inside get all Currency Pot Balance Service')
	try {
		const response: any = await axios
			.post(`${Config.PAYMENT.CAXTON.GET_ALL_CURRENCY_POT_BALANCE}`, payload, {
				headers: {
					authorization: authToken,
				},
			})
			.catch((error) => {
				errorMessage = error.response.data.msg
				errorStatus = error.response.status
			})
		if (!errorStatus) {
			balanceArray = response.data.data.responseObject

			if (!balanceArray) return null

			const { expireDate: caxtonExpireDate, userAPIToken: caxtonUserApiToken } =
				response.data.data.userObj

			return {
				balanceArray,
				caxtonExpireDate,
				caxtonUserApiToken,
			}
		} else {
			return null
		}
	} catch (err) {
		Logger.error(err)
		throw err
	}
}

// Transfer within User Main Pots and Currency Pots
export const transferBetweenPots = async (payload: PotTransferInterface, authToken: string) => {
	Logger.info('inside transfer Between Pots Service ')
	try {
		let errorMessage
		let errorStatus

		const response: any = await axios
			.post(`${Config.PAYMENT.CAXTON.TRANSFER_BETWEEN_POTS}`, payload, {
				headers: {
					authorization: authToken,
				},
			})
			.catch((error) => {
				errorMessage = error.response.data.msg
				errorStatus = error.response.status
			})

		if (!errorStatus) {
			const { expireDate: caxtonExpireDate, userAPIToken: caxtonUserApiToken } =
				response.data.data.userObj

			if (response.data.status === 200)
				return {
					status: true,
					caxtonExpireDate,
					caxtonUserApiToken,
				}
		}

		return {
			errorMessage,
			errorStatus,
			status: false,
		}
	} catch (err) {
		Logger.error(err)
		throw err
	}
}

// Transfer to another User account
export const transferBetweenAccounts = async (
	payload: AccountTransferInterface,
	authToken: string
) => {
	Logger.info('inside transfer Between Accounts Service ')
	try {
		let errorMessage
		let errorStatus

		const response: any = await axios
			.post(`${Config.PAYMENT.CAXTON.TRANSFER_BETWEEN_ACCOUNTS}`, payload, {
				headers: {
					authorization: authToken,
				},
			})
			.catch((error) => {
				errorMessage = error.response.data.msg
				errorStatus = error.response.status
			})
		if (!errorStatus) {
			const { expireDate: caxtonExpireDate, userAPIToken: caxtonUserApiToken } =
				response.data.data.userObj

			if (response.data.status === 200)
				return {
					status: true,
					caxtonExpireDate,
					caxtonUserApiToken,
				}
		}

		return {
			errorMessage,
			errorStatus,
			status: false,
		}
	} catch (err) {
		Logger.error(err)
		throw err
	}
}

export const getCaxtonTransactionByccyCode = async (authToken: string, ccyCode: string) => {
	try {
		const caxtonResponse: any = (await axios
			.get(`${Config.PAYMENT.CAXTON.GET_TRANSACTION_BY_CCY_CODE}/${ccyCode}`, {
				headers: {
					authorization: authToken,
				},
			})
			.catch((err) => {
				return false
			}))!
		return caxtonResponse.data.data
	} catch (err) {
		Logger.error(err)
		throw err
	}
}
