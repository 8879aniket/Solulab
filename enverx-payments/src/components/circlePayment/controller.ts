import { v4 as uuid } from 'uuid'
import {
	Configuration,
	CountryCode,
	PlaidApi,
	PlaidEnvironments,
	ProcessorTokenCreateRequest,
	ProcessorTokenCreateRequestProcessorEnum,
	Products,
} from 'plaid'
import { TransactionInterface } from '@interfaces/transaction'
import { Request, Response, NextFunction } from 'express'
import Config from '@config/config'
import { Logger } from '@config/logger'
import { errorHandler, responseHandler } from '@helpers/responseHandlers'
import { getCircleAPICall, postCircleAPICall } from '@circlePayment/circleAPI'
import {
	createWalletValidation,
	createWirePaymentValidation,
	createTransferValidation,
	createPayoutValidation,
	createAccessTokenValidation,
	createACHPaymentValidation,
} from '@circlePayment/validation'
import {
	createTransactionService,
	getTransactionService,
	getAllTransaction,
	getPlatformTransactionHistoryService,
	getAllTransactionByWalletIdService,
	updateTransactionService,
} from '@circlePayment/service'
import Messages from '@helpers/messages'
import { getUserService } from '@dummy/user/service'
import { getAdminService } from '@dummy/admin/service'

const configuration = new Configuration({
	basePath: PlaidEnvironments[Config.PLAID.PLAID_ENV!],
	baseOptions: {
		headers: {
			'PLAID-CLIENT-ID': Config.PLAID.PLAID_CLIENT_ID,
			'PLAID-SECRET': Config.PLAID.PLAID_SECRET,
		},
	},
})
const client = new PlaidApi(configuration)

export const balance = async (req: Request, res: Response, next: NextFunction) => {
	Logger.info('Inside get balance controller')
	try {
		const baseURL: string = `balances`
		const response = await getCircleAPICall(baseURL)
		if (response === null) {
			return errorHandler({
				res,
				err: Messages.SOMETHING_WENT_WRONG,
				statusCode: 502,
			})
		}
		return responseHandler({
			res,
			data: response,
			msg: Messages.BALANCE_FETCHED,
		})
	} catch (err) {
		Logger.error(err)
		errorHandler({ res, data: { err } })
	}
}

export const createBankAccount = async (req: Request, res: Response, next: NextFunction) => {
	Logger.info('Inside create bank account controller')
	try {
		let {
			id,
			account_number,
			routing_number,
			IBAN,
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
		}: {
			id: string
			account_number: string
			routing_number: string
			IBAN: string
			billing_name: string
			billing_city: string
			billing_country: string
			billing_line1: string
			billing_line2: string
			billing_district: string
			billing_postalCode: string
			bank_name: string
			bank_city: string
			bank_country: string
			bank_line1: string
			bank_line2: string
			bank_district: string
			type_of_account: string
		} = req.body
		const userId = req.user.id
		const userData = await getUserService({ id: userId })
		if (userData === null) {
			const adminData = await getAdminService({ id: userId })
			if (adminData === null) {
				return errorHandler({
					res,
					err: Messages.USER_NOT_FOUND,
					statusCode: 502,
				})
			}
		}
		let bankObject: object = {}
		switch (type_of_account) {
			case 'US':
				bankObject = {
					idempotencyKey: id,
					accountNumber: account_number,
					routingNumber: routing_number,
					billingDetails: {
						name: billing_name,
						city: billing_city,
						country: billing_country,
						line1: billing_line1,
						line2: billing_line2 || '',
						district: billing_district,
						postalCode: billing_postalCode,
					},
					bankAddress: {
						bankName: bank_name,
						city: bank_city,
						country: bank_country,
						line1: bank_line1,
						line2: bank_line2 || '',
						district: bank_district,
					},
				}
				break
			case 'IBAN':
				bankObject = {
					idempotencyKey: id,
					accountNumber: account_number,
					routingNumber: routing_number,
					iban: IBAN,
					billingDetails: {
						name: billing_name,
						city: billing_city,
						country: billing_country,
						line1: billing_line1,
						line2: billing_line2 || '',
						district: billing_district,
						postalCode: billing_postalCode,
					},
					bankAddress: {
						bankName: bank_name,
						city: bank_city,
						country: bank_country,
						line1: bank_line1,
						line2: bank_line2 || '',
						district: bank_district,
					},
				}
				break
			case 'NON_IBAN':
				bankObject = {
					idempotencyKey: id,
					accountNumber: account_number,
					routingNumber: routing_number,
					billingDetails: {
						name: billing_name,
						city: billing_city,
						country: billing_country,
						line1: billing_line1,
						line2: billing_line2 || '',
						district: billing_district,
						postalCode: billing_postalCode,
					},
					bankAddress: {
						bankName: bank_name,
						city: bank_city,
						country: bank_country,
						line1: bank_line1,
						line2: bank_line2 || '',
						district: bank_district,
					},
				}
				break
			default:
				break
		}
		const baseURL: string = `banks/wires`
		const response = await postCircleAPICall(baseURL, bankObject)
		if (response?.code) {
			return errorHandler({
				res,
				err: response.message,
				statusCode: 502,
			})
		}
		return responseHandler({
			res,
			data: response,
			msg: Messages.BANK_ACCOUNT_CREATE_SUCCESS,
		})
	} catch (err) {
		Logger.error(err)
		errorHandler({ res, data: { err } })
	}
}

export const createWallet = async (req: Request, res: Response) => {
	Logger.info('Inside create wallet controller')
	try {
		const { idempotencyKey, description }: { idempotencyKey: string; description: string } =
			req.body
		const { error, message } = await createWalletValidation({ idempotencyKey, description })
		if (error) {
			return errorHandler({ res, statusCode: 501, err: message })
		}
		const baseURL = `wallets`
		const response = await postCircleAPICall(baseURL, { idempotencyKey, description })
		if (response?.code) {
			Logger.error(response)
			return errorHandler({
				res,
				err: response.message,
				statusCode: 502,
			})
		}
		if (!response) {
			Logger.error(response)
			return errorHandler({
				res,
				err: response.message,
				statusCode: 502,
			})
		}
		return responseHandler({
			res,
			data: response,
			msg: Messages.WALLET_CREATED_SUCCESS,
		})
	} catch (err) {
		Logger.error(err)
		errorHandler({ res, data: { err } })
	}
}

export const createWirePayment = async (req: Request, res: Response) => {
	Logger.info('Inside create Wire Payment controller')
	try {
		const {
			trackingRef,
			accountId,
			amount,
			currency,
			bankName,
		}: {
			trackingRef: string
			accountId: string
			amount: string
			currency: string
			bankName: string
		} = req.body
		const userId = req.user.id
		const { error, message } = await createWirePaymentValidation({
			userId,
			trackingRef,
			accountId,
			amount,
			currency,
			bankName,
		})
		if (error) {
			return errorHandler({ res, statusCode: 501, err: message })
		}
		if (parseInt(amount) <= 0) {
			return errorHandler({
				res,
				err: Messages.AMOUNT_VALUE_ERROR,
				statusCode: 502,
			})
		}
		const userData = await getUserService({ id: userId })
		if (userData === null) {
			const adminData = await getAdminService({ id: userId })
			if (adminData === null) {
				return errorHandler({
					res,
					err: Messages.USER_NOT_FOUND,
					statusCode: 502,
				})
			}
		}
		const transactionStatus = 'pending'
		const amountData = parseFloat(amount)
		const transactionType = 'PAYMENT'

		// -- This comment will be removed when circle notifictaion is integrated

		const transactionDetails = await getTransactionService(
			userId,
			trackingRef,
			amountData,
			currency,
			transactionStatus,
			transactionType
		)
		if (transactionDetails) {
			return errorHandler({
				res,
				err: Messages.WIRE_PAYMENT_ALREADY_EXIST,
				statusCode: 502,
			})
		}
		const baseURL_instruction = `banks/wires/${accountId}/instructions`
		const instruction = await getCircleAPICall(baseURL_instruction)
		const beneficiaryAccountNumber = instruction.data.beneficiaryBank.accountNumber
		const payload = {
			trackingRef: trackingRef,
			amount: {
				amount: amount,
				currency: currency,
			},
			beneficiaryBank: { accountNumber: beneficiaryAccountNumber },
		}
		const baseURL = `mocks/payments/wire`
		const response = await postCircleAPICall(baseURL, payload)
		if (response?.code) {
			return errorHandler({
				res,
				err: Messages.SOMETHING_WENT_WRONG,
				statusCode: 502,
			})
		}
		// if (response === null) {
		// 	return errorHandler({
		// 		res,
		// 		err: Messages.WIRE_PAYMENT_FAILED,
		// 		statusCode: 502,
		// 	})
		// }
		const transactionObj: TransactionInterface = {
			id: uuid(),
			tracking_ref: response.data.trackingRef,
			amount: parseFloat(response.data.amount.amount),
			currency: response.data.amount.currency,
			status: response.data.status,
			internalStatus: response.data.status,
			transaction_type: 'PAYMENT',
			bankName,
			userId,
		}
		const transaction = await createTransactionService(transactionObj)
		if (transaction === null) {
			return errorHandler({
				res,
				err: Messages.TRANSACTION_CREATED_FAILED,
				statusCode: 502,
			})
		}
		return responseHandler({
			res,
			data: response,
			msg: Messages.WIRE_PAYMENT_SUCCESS,
		})
	} catch (err) {
		Logger.error(err)
		errorHandler({ res, data: { err } })
	}
}

export const getWalletDetails = async (req: Request, res: Response) => {
	Logger.info('Inside Get Wallet Details controller')
	try {
		const userId = req.user.id
		let baseURL: string
		const userData = await getUserService({ id: userId })
		if (userData === null) {
			const adminData = await getAdminService({ id: userId })
			if (adminData === null) {
				return errorHandler({
					res,
					err: Messages.USER_NOT_FOUND,
					statusCode: 502,
				})
			} else {
				if (!adminData.walletId) {
					return errorHandler({
						res,
						err: Messages.WALLET_NOT_FOUND,
						statusCode: 506,
					})
				}
				baseURL = `wallets/${adminData.walletId}`
			}
		} else {
			if (!userData.walletId) {
				return errorHandler({
					res,
					err: Messages.WALLET_NOT_FOUND,
					statusCode: 506,
				})
			}
			baseURL = `wallets/${userData.walletId}`
		}
		const response = await getCircleAPICall(baseURL)
		if (response && !response.code) {
			return responseHandler({
				res,
				data: response,
				msg: Messages.WALLET_DETAIL_FETCHED_SUCCESS,
			})
		}
		return errorHandler({
			res,
			err: Messages.WALLET_NOT_FOUND,
			statusCode: 502,
		})
	} catch (err) {
		Logger.error(err)
		errorHandler({ res, data: { err } })
	}
}

export const createTransfer = async (req: Request, res: Response) => {
	Logger.info('Inside Create Transfer controller')
	try {
		let {
			sourceWalletId,
			sourceType,
			destinationWalletId,
			destinationType,
			amount,
			currency,
			userId,
		}: // isInvestmentSuccess,
		// investmentTransactionHash,
		{
			sourceWalletId: string
			sourceType: string
			destinationWalletId: string
			destinationType: string
			amount: string
			currency: string
			userId: string
			// isInvestmentSuccess: boolean
			// investmentTransactionHash: string
		} = req.body
		const user_Id = req.user.id
		if (!userId) {
			userId = user_Id
		}
		const { error, message } = await createTransferValidation({
			sourceWalletId,
			sourceType,
			destinationWalletId,
			destinationType,
			amount,
			currency,
			userId,
		})
		if (error) {
			return errorHandler({ res, statusCode: 501, err: message })
		}

		const payload = {
			idempotencyKey: uuid(),
			source: { id: sourceWalletId, type: sourceType },
			destination: { id: destinationWalletId, type: destinationType },
			amount: { amount: amount, currency: currency },
		}
		const baseURL: string = `transfers`
		const response = await postCircleAPICall(baseURL, payload)
		if (response?.code) {
			return errorHandler({
				res,
				err: response.message,
				statusCode: 502,
			})
		}
		// if (response === null) {
		// 	return errorHandler({
		// 		res,
		// 		err: Messages.WALLET_TRANSFER_FAILED,
		// 		statusCode: 502,
		// 	})
		// }
		const transactionObj: TransactionInterface = {
			id: uuid(),
			transaction_id: response.data.id,
			transaction_type: 'TRANSFER',
			source_wallet_type: sourceType,
			source_wallet_id: sourceWalletId,
			destination_wallet_type: destinationType,
			destination_wallet_id: destinationWalletId,
			amount: parseFloat(response.data.amount.amount),
			currency: response.data.amount.currency,
			status: response.data.status,
			internalStatus: response.data.status,
			// isInvestmentSuccess,
			// investmentTransactionHash,
			userId,
		}
		const transaction = await createTransactionService(transactionObj)
		if (transaction === null) {
			return errorHandler({
				res,
				err: Messages.TRANSACTION_CREATED_FAILED,
				statusCode: 502,
			})
		}
		return responseHandler({
			res,
			data: response,
			msg: Messages.WALLET_TRANSFER_SUCCESS,
		})
	} catch (err) {
		Logger.error(err)
		errorHandler({ res, data: { err } })
	}
}

export const createPayout = async (req: Request, res: Response) => {
	Logger.info('Inside Create Payout controller')
	try {
		const {
			sourceType,
			sourceId,
			destinationType,
			detsinationId,
			amount,
			currency,
			beneficiaryEmail,
			bankName,
		}: {
			sourceType: string
			sourceId: string
			destinationType: string
			detsinationId: string
			amount: string
			currency: string
			beneficiaryEmail: string
			bankName: string
		} = req.body
		const userId = req.user.id
		const { error, message } = await createPayoutValidation({
			sourceType,
			sourceId,
			destinationType,
			detsinationId,
			amount,
			currency,
			beneficiaryEmail,
			userId,
			bankName,
		})
		if (error) {
			return errorHandler({ res, statusCode: 501, err: message })
		}
		if (parseInt(amount) <= 0) {
			return errorHandler({
				res,
				err: Messages.AMOUNT_VALUE_ERROR,
				statusCode: 502,
			})
		}
		const payload = {
			idempotencyKey: uuid(),
			source: { type: sourceType, id: sourceId },
			destination: { type: destinationType, id: detsinationId },
			amount: { amount: amount, currency: currency },
			metadata: { beneficiaryEmail: beneficiaryEmail },
		}
		const baseURL: string = `payouts`
		const response = await postCircleAPICall(baseURL, payload)
		if (response?.code) {
			return errorHandler({
				res,
				err: response.message,
				statusCode: 502,
			})
		}
		// if (response === null) {
		// 	return errorHandler({
		// 		res,
		// 		err: Messages.PAYOUT_CREATE_FAILED,
		// 		statusCode: 502,
		// 	})
		// }
		const transactionObj: TransactionInterface = {
			id: uuid(),
			transaction_id: response.data.id,
			transaction_type: 'PAYOUT',
			source_wallet_type: sourceType,
			source_wallet_id: sourceId,
			destination_wallet_type: destinationType,
			destination_wallet_id: detsinationId,
			amount: parseFloat(response.data.amount.amount),
			currency: response.data.amount.currency,
			status: response.data.status,
			internalStatus: response.data.status,
			bankName,
			userId,
		}
		const transaction = await createTransactionService(transactionObj)
		if (transaction === null) {
			return errorHandler({
				res,
				err: Messages.TRANSACTION_CREATED_FAILED,
				statusCode: 502,
			})
		}
		return responseHandler({
			res,
			data: response,
			msg: Messages.PAYOUT_CREATE_SUCCESS,
		})
	} catch (err) {
		Logger.error(err)
		errorHandler({ res, data: { err } })
	}
}

export const getAllTransactionHistory = async (req: Request, res: Response) => {
	Logger.info('Inside Get all Transaction History controller')
	try {
		const userId = req.user.id
		const { offset, limit, orderBy, orderType, status, type, startDate } = req.query
		const strOffset: string = offset ? offset.toString() : '0'
		const strLimit: string = limit ? limit.toString() : '10'
		const strorderBy: string = orderBy !== undefined ? orderBy?.toString()! : 'createdAt'
		const strorderType: string = orderType !== undefined ? orderType?.toString()! : 'DESC'
		const strStatus: string = status ? status.toString() : ''
		const srtType: string = type ? type.toString() : ''
		const stDate: string = startDate ? startDate.toString() : ''
		const Id: string = userId!.toString()
		let baseURL: string
		let idUser: string
		if (!userId) {
			return errorHandler({
				res,
				err: 'User Id not found',
				statusCode: 502,
			})
		}
		const userData = await getUserService({ id: Id })
		if (userData === null) {
			const adminData = await getAdminService({ id: Id })
			if (adminData === null) {
				return errorHandler({
					res,
					err: Messages.USER_NOT_FOUND,
					statusCode: 502,
				})
			} else {
				if (!adminData.walletId) {
					return errorHandler({
						res,
						err: Messages.WALLET_NOT_FOUND,
						statusCode: 506,
					})
				}
				baseURL = `wallets/${adminData.walletId}`
				idUser = adminData.id
			}
		} else {
			if (!userData.walletId) {
				return errorHandler({
					res,
					err: Messages.WALLET_NOT_FOUND,
					statusCode: 506,
				})
			}
			baseURL = `wallets/${userData.walletId}`
			idUser = userData.id
		}
		const response = await getCircleAPICall(baseURL)
		if (response === null) {
			return errorHandler({
				res,
				err: Messages.SOMETHING_WENT_WRONG,
				statusCode: 502,
			})
		}
		const balance = response.data.balances.length !== 0 ? response.data.balances[0].amount : 0
		const transactionList = await getAllTransaction(
			idUser,
			parseInt(strOffset),
			parseInt(strLimit),
			strorderBy,
			strorderType,
			strStatus,
			srtType,
			stDate
		)
		return responseHandler({
			res,
			data: { transactionList, balance },
			msg: Messages.TRANSACTION_LIST_FETCH_SUCCESS,
		})
	} catch (err) {
		Logger.error(err)
		errorHandler({ res, data: { err } })
	}
}

export const getPlatformTransactionHistory = async (req: Request, res: Response) => {
	Logger.info('Inside Platform Transaction History controller')
	try {
		const { offset, limit, search, transactionType, status, startDate, endDate } = req.query
		const strOffset: string = offset ? offset.toString() : '0'
		const strLimit: string = limit ? limit.toString() : '10'
		const searchText: string = search !== undefined ? search?.toString()! : ''
		const txn: string = transactionType !== undefined ? transactionType?.toString()! : ''
		const statusData: string = status !== undefined ? status?.toString()! : ''
		const stDate = startDate !== undefined ? startDate?.toString() : ''
		const enDate: string = endDate ? endDate.toString() : new Date().toISOString().split('T')[0]
		const transactionList = await getPlatformTransactionHistoryService(
			parseInt(strOffset),
			parseInt(strLimit),
			searchText,
			txn,
			statusData,
			stDate,
			enDate
		)
		return responseHandler({
			res,
			data: transactionList,
			msg: Messages.TRANSACTION_LIST_FETCH_SUCCESS,
		})
	} catch (err) {
		Logger.error(err)
		errorHandler({ res, data: { err } })
	}
}

//! Need to test after FE integration done
export const getPlaidLinkToken = async (req: Request, res: Response) => {
	Logger.info('Inside Get Plaid Link Token controller')
	try {
		const userId = req.user.id
		const request = {
			user: {
				client_user_id: userId.toString(),
			},
			client_name: 'EnverX_Circle_Account',
			products: [Products.Auth],
			country_codes: [CountryCode.Us],
			language: 'en',
		}
		const createTokenResponse = await client.linkTokenCreate(request)
		if (!createTokenResponse) {
			return errorHandler({
				res,
				err: Messages.PLAID_LINK_TOKEN_FAILED,
				statusCode: 502,
			})
		}
		const linkTokenData = createTokenResponse.data
		return responseHandler({
			res,
			data: linkTokenData,
			msg: Messages.PLAID_LINK_TOKEN_SUCCESS,
		})
	} catch (err) {
		Logger.error(err)
		errorHandler({ res, data: { err } })
	}
}

//! Need to test after FE integration done
export const createAccessToken = async (req: Request, res: Response) => {
	Logger.info('Inside Create Access Token controller')
	try {
		const {
			publicToken,
			accountId,
			link_session_id,
		}: { publicToken: string; accountId: string; link_session_id: string } = req.body
		const userId = req.user.id

		const { error, message } = await createAccessTokenValidation({
			publicToken,
			userId,
			accountId,
		})
		if (error) {
			return errorHandler({ res, statusCode: 501, err: message })
		}

		const userData = await getUserService({ id: userId })
		if (userData === null) {
			const adminData = await getAdminService({ id: userId })
			if (adminData === null) {
				return errorHandler({
					res,
					err: Messages.USER_NOT_FOUND,
					statusCode: 502,
				})
			}
		}
		const tokenResponse = await client.itemPublicTokenExchange({
			public_token: publicToken,
		})
		if (!tokenResponse) {
			return errorHandler({
				res,
				err: Messages.PLAID_ACCESS_TOKEN_FAILED,
				statusCode: 502,
			})
		}
		const accessToken = tokenResponse.data.access_token
		const request: ProcessorTokenCreateRequest = {
			access_token: accessToken,
			account_id: accountId,
			processor: ProcessorTokenCreateRequestProcessorEnum.Circle,
		}
		const processorTokenResponse = await client.processorTokenCreate(request)
		if (!processorTokenResponse) {
			return errorHandler({
				res,
				err: Messages.PLAID_PROCESS_TOKEN_FAILED,
				statusCode: 502,
			})
		}
		const processorToken = processorTokenResponse.data.processor_token
		const responseData = {
			accessToken,
			processorToken,
			plaidAccountId: accountId,
			link_session_id,
		}
		return responseHandler({
			res,
			data: responseData,
			msg: Messages.PLAID_PROCESS_TOKEN_SUCCESS,
		})
	} catch (error: any) {
		Logger.error(error)
		return errorHandler({
			res,
			err: error.response.data.error_message,
			statusCode: 502,
		})
	}
}

export const createACHBankAccount = async (req: Request, res: Response, next: NextFunction) => {
	Logger.info('Inside create ACH bank account controller')
	try {
		const {
			id,
			billing_name,
			plaid_processer_token,
			ip_address,
			session_id,
		}: {
			id: string
			billing_name: string
			plaid_processer_token: string
			ip_address: string
			session_id: string
		} = req.body
		const userId = req.user.id
		let userDetails: any
		const userData = await getUserService({ id: userId })
		if (userData === null) {
			const adminData = await getAdminService({ id: userId })
			if (adminData === null) {
				return errorHandler({
					res,
					err: Messages.USER_NOT_FOUND,
					statusCode: 502,
				})
			}
			userDetails = adminData
		} else {
			userDetails = userData
		}
		const bankObject = {
			billingDetails: {
				name: billing_name,
			},
			metadata: {
				email: userDetails.email,
				sessionId: session_id,
				ipAddress: ip_address,
			},
			idempotencyKey: id,
			plaidProcessorToken: plaid_processer_token,
		}
		const baseURL: string = `banks/ach`
		const response = await postCircleAPICall(baseURL, bankObject)
		if (response?.code) {
			return errorHandler({
				res,
				err: response.message,
				statusCode: 502,
			})
		}
		return responseHandler({
			res,
			data: response,
			msg: Messages.BANK_ACCOUNT_CREATE_SUCCESS,
		})
	} catch (err) {
		Logger.error(err)
		errorHandler({ res, data: { err } })
	}
}

export const createACHPayment = async (req: Request, res: Response) => {
	Logger.info('Inside create ACH Payment controller')
	try {
		const {
			ipAddress,
			amount,
			currency,
			accountType,
			accountId,
			bankName,
		}: {
			ipAddress: string
			amount: string
			currency: string
			accountType: string
			accountId: string
			bankName: string
		} = req.body
		const userId = req.user.id

		const { error, message } = await createACHPaymentValidation({
			ipAddress,
			amount,
			currency,
			accountType,
			accountId,
			userId,
			bankName,
		})
		if (error) {
			return errorHandler({ res, statusCode: 501, err: message })
		}
		if (parseInt(amount) <= 0) {
			return errorHandler({
				res,
				err: Messages.AMOUNT_VALUE_ERROR,
				statusCode: 502,
			})
		}
		let userDetails: any
		const userData = await getUserService({ id: userId })
		if (userData === null) {
			const adminData = await getAdminService({ id: userId })
			if (adminData === null) {
				return errorHandler({
					res,
					err: Messages.USER_NOT_FOUND,
					statusCode: 502,
				})
			}
			userDetails = adminData
		} else {
			userDetails = userData
		}
		const payload = {
			metadata: {
				email: userDetails!.email,
				sessionId: uuid(),
				ipAddress: ipAddress,
			},
			amount: { currency: currency, amount: amount },
			autoCapture: true,
			source: { id: accountId, type: accountType },
			idempotencyKey: uuid(),
			keyId: uuid(),
			verification: 'none',
		}
		const baseURL = `payments`
		const response = await postCircleAPICall(baseURL, payload)
		if (response?.code) {
			return errorHandler({
				res,
				err: response.message,
				statusCode: 502,
			})
		}
		const transactionObj: TransactionInterface = {
			id: uuid(),
			tracking_ref: response.data.trackingRef,
			amount: parseFloat(response.data.amount.amount),
			currency: response.data.amount.currency,
			status: response.data.status,
			internalStatus: response.data.status,
			transaction_type: 'PAYMENT',
			transaction_id: response.data.id,
			source_wallet_id: response.data.source.id,
			source_wallet_type: response.data.source.type,
			destination_wallet_id: response.data.merchantWalletId,
			destination_wallet_type: 'wallet',
			bankName,
			userId,
		}
		const transaction = await createTransactionService(transactionObj)
		if (transaction === null) {
			return errorHandler({
				res,
				err: Messages.TRANSACTION_CREATED_FAILED,
				statusCode: 502,
			})
		}
		return responseHandler({
			res,
			data: response,
			msg: Messages.ACH_PAYMENT_SUCCESS,
		})
	} catch (err) {
		Logger.error(err)
		errorHandler({ res, data: { err } })
	}
}

export const getWalletbalance = async (req: Request, res: Response, next: NextFunction) => {
	Logger.info('Inside get User balance controller')
	try {
		const { walletId } = req.params
		const baseURL: string = `wallets/${walletId}`
		const response = await getCircleAPICall(baseURL)
		if (response === null) {
			return errorHandler({
				res,
				err: Messages.SOMETHING_WENT_WRONG,
				statusCode: 502,
			})
		}
		return responseHandler({
			res,
			data: response,
			msg: Messages.WALLET_FETCHED,
		})
	} catch (err) {
		Logger.error(err)
		errorHandler({ res, data: { err } })
	}
}

export const getAllWallet = async (req: Request, res: Response, next: NextFunction) => {
	Logger.info('Inside Get All Wallet controller')
	try {
		const baseURL: string = `wallets`
		const response = await getCircleAPICall(baseURL)
		if (response === null) {
			return errorHandler({
				res,
				err: Messages.SOMETHING_WENT_WRONG,
				statusCode: 502,
			})
		}
		return responseHandler({
			res,
			data: response,
			msg: Messages.WALLET_FETCHED,
		})
	} catch (err) {
		Logger.error(err)
		errorHandler({ res, data: { err } })
	}
}

export const getUserWallet = async (req: Request, res: Response, next: NextFunction) => {
	Logger.info('Inside get User Wallet controller')
	try {
		const { userId } = req.params
		let baseURL: string
		const userData = await getUserService({ id: userId })
		if (userData === null) {
			const adminData = await getAdminService({ id: userId })
			if (adminData === null) {
				return errorHandler({
					res,
					err: Messages.USER_NOT_FOUND,
					statusCode: 502,
				})
			} else {
				if (!adminData.walletId) {
					return errorHandler({
						res,
						err: Messages.WALLET_NOT_FOUND,
						statusCode: 506,
					})
				}
				baseURL = `wallets/${adminData.walletId}`
			}
		} else {
			if (!userData.walletId) {
				return errorHandler({
					res,
					err: Messages.WALLET_NOT_FOUND,
					statusCode: 506,
				})
			}
			baseURL = `wallets/${userData.walletId}`
		}
		const response = await getCircleAPICall(baseURL)
		if (response === null) {
			return errorHandler({
				res,
				err: Messages.SOMETHING_WENT_WRONG,
				statusCode: 502,
			})
		}
		return responseHandler({
			res,
			data: response,
			msg: Messages.WALLET_FETCHED,
		})
	} catch (err) {
		Logger.error(err)
		errorHandler({ res, data: { err } })
	}
}

export const getAllTransactionByWalletId = async (req: Request, res: Response) => {
	try {
		Logger.info('Inside Get All transaction By Wallet Id controller')
		const { walletId } = req.params
		const transactionData = await getAllTransactionByWalletIdService(walletId.toString())
		return responseHandler({
			res,
			data: transactionData,
			msg: Messages.TRANSACTION_LIST_FETCH_SUCCESS,
		})
	} catch (err) {
		Logger.error(err)
		errorHandler({ res, data: { err } })
	}
}

export const updateTransaction = async (req: Request, res: Response) => {
	try {
		Logger.info('Inside Update Transaction controller')
		const { transactionId, tokenStatus }: { transactionId: string; tokenStatus: string } = req.body
		await updateTransactionService(transactionId, tokenStatus)
		return responseHandler({
			res,
			msg: Messages.UPDATE_TRANSACTION,
		})
	} catch (err) {
		Logger.error(err)
		errorHandler({ res, data: { err } })
	}
}
