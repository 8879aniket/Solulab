import User from '@dummy/user/user.model'
import { v4 as uuid } from 'uuid'
import { postCircleAPICall } from '@circlePayment/circleAPI'
import { createTransactionService } from '@circlePayment/service'
import { TransactionInterface } from '@interfaces/transaction'
import { Logger } from '@config/logger'
import Transactions from '@circlePayment/transection.model'

export const webhookService = async () => {
	Logger.info('Inside Webhook service')
	try {
	} catch (err) {
		Logger.error(err)
	}
}

export const updateWirePayment = async (
	trackingRef: string,
	amount: number,
	currency: string,
	transactionType: string,
	status: string,
	transactionId: string,
	fees: number
) => {
	Logger.info('Inside Update Wire Payment service')
	try {
		const recivedAmount = parseFloat((amount - fees).toFixed(2))
		const bankData = await Transactions.findOne({
			where: {
				tracking_ref: trackingRef,
				amount,
				currency,
				transaction_type: transactionType,
			},
		})
			.then((result) => {
				if (result) {
					result.update(
						{
							status,
							transaction_id: transactionId,
							amountRecived: recivedAmount,
						},
						{
							where: {
								tracking_ref: trackingRef,
								amount,
								currency,
								transaction_type: transactionType,
							},
						}
					)
				}
			})
			.catch((error) => {
				Logger.error(error)
				return null
			})

		return bankData
	} catch (err) {
		Logger.error(err)
	}
}

export const updateWirePaymentAfterConfirm = async (
	transactionType: string,
	status: string,
	transactionId: string
) => {
	Logger.info('Inside Update Wire Payment After Confirm service')
	try {
		const bankData = await Transactions.findOne({
			where: {
				transaction_id: transactionId,
				transaction_type: transactionType,
			},
		})
			.then((result) => {
				result!.update(
					{
						status,
					},
					{
						where: {
							transaction_id: transactionId,
							transaction_type: transactionType,
						},
					}
				)
			})
			.catch((error) => {
				Logger.error(error)
				return null
			})

		return bankData
	} catch (err) {
		Logger.error(err)
	}
}

export const getWireTransactionData = async (
	trackingRef: string,
	transactionId: string,
	transactionType: string
) => {
	Logger.info('Inside Get Wire Transaction Data service')
	try {
		const bankData = await Transactions.findOne({
			where: {
				tracking_ref: trackingRef,
				transaction_id: transactionId,
				transaction_type: transactionType,
			},
		})
		if (!bankData) {
			return null
		}
		return bankData
	} catch (err) {
		Logger.error(err)
	}
}

export const getACHTransactionData = async (transactionId: string, transactionType: string) => {
	Logger.info('Inside Get ACH Transaction Data service')
	try {
		const bankData = await Transactions.findOne({
			where: {
				transaction_id: transactionId,
				transaction_type: transactionType,
			},
		})
		if (!bankData) {
			return null
		}
		return bankData
	} catch (err) {
		Logger.error(err)
	}
}

export const updateTransferAndPayout = async (
	amount: number,
	currency: string,
	transactionType: string,
	status: string,
	transactionId: string
) => {
	Logger.info('Inside Update Transfer service')
	try {
		const bankData = await Transactions.findOne({
			where: {
				amount,
				currency,
				transaction_id: transactionId,
			},
		})
		if (bankData) {
			const transactionData = await Transactions.findOne({
				where: {
					amountRecived: amount,
					currency,
					transaction_type: 'PAYMENT',
					status: 'paid',
					internalStatus: 'pending',
				},
			})
			if (transactionData) {
				transactionData.internalStatus = 'complete'
				await transactionData.save()
				bankData.status = status
				bankData.internalStatus = 'Done'
				await bankData.save()
			} else {
				bankData.status = status
				bankData.internalStatus = status
				await bankData.save()
			}

			return bankData
		}
		return null
	} catch (err) {
		Logger.error(err)
	}
}

export const updateACHPayment = async (
	trackingRef: string,
	transactionType: string,
	transactionId: string,
	amount: number,
	fees: number
) => {
	Logger.info('Inside Update ACH Payment service')
	try {
		const recivedAmount = parseFloat((amount - fees).toFixed(2))
		const bankData = await Transactions.findOne({
			where: {
				transaction_id: transactionId,
				transaction_type: transactionType,
			},
		})
			.then((result) => {
				result!.update(
					{
						status: 'paid',
						tracking_ref: trackingRef,
						amountRecived: recivedAmount,
					},
					{
						where: {
							transaction_id: transactionId,
							transaction_type: transactionType,
						},
					}
				)
			})
			.catch((error) => {
				Logger.error(error)
				return null
			})

		return bankData
	} catch (err) {
		Logger.error(err)
	}
}

export const createTransferAfterWirePayment = async (
	transactionId: string,
	amount: number,
	currency: string,
	transactionType: string,
	merchantWalletId: string,
	wirePaymentFees: number
) => {
	Logger.info('Inside Create Transfer After Wire Payment service')
	try {
		const bankData = await Transactions.findOne({
			where: {
				transaction_id: transactionId,
				transaction_type: transactionType,
			},
		})
		if (!bankData) {
			return null
		}
		const userData = await User.findOne({ where: { id: bankData.userId } })
		if (!userData) {
			return null
		}
		const amountData = amount - wirePaymentFees
		const payload = {
			idempotencyKey: uuid(),
			source: { id: merchantWalletId, type: 'wallet' },
			destination: { id: userData.walletId, type: 'wallet' },
			amount: { amount: parseFloat(amountData.toFixed(2)), currency: currency },
		}
		const baseURL: string = `transfers`
		const response = await postCircleAPICall(baseURL, payload)
		if (response?.code) {
			Logger.error(response.message)
			return null
		}
		const transactionObj: TransactionInterface = {
			id: uuid(),
			transaction_id: response.data.id,
			transaction_type: 'DEPOSIT_TRANSFER',
			source_wallet_type: 'wallet',
			source_wallet_id: merchantWalletId,
			destination_wallet_type: 'wallet',
			destination_wallet_id: userData.walletId,
			amount: parseFloat(response.data.amount.amount),
			currency: response.data.amount.currency,
			status: response.data.status,
			internalStatus: response.data.status, //  Testing
			userId: userData.id,
		}
		const transaction = await createTransactionService(transactionObj)
		if (transaction === null) {
			return null
		}
		return true
	} catch (err) {
		Logger.error(err)
	}
}

export const createTransferAfterACHPayment = async (
	transactionId: string,
	amount: number,
	currency: string,
	transactionType: string,
	merchantWalletId: string,
	fees: number
) => {
	Logger.info('Inside Create Transfer After ACH Payment service')
	try {
		const bankData = await Transactions.findOne({
			where: {
				transaction_id: transactionId,
				transaction_type: transactionType,
			},
		})
		if (!bankData) {
			return null
		}
		const userData = await User.findOne({ where: { id: bankData.userId } })
		if (!userData) {
			return null
		}
		const amountData = amount - fees
		const payload = {
			idempotencyKey: uuid(),
			source: { id: merchantWalletId, type: 'wallet' },
			destination: { id: userData.walletId, type: 'wallet' },
			amount: { amount: parseFloat(amountData.toFixed(2)), currency: currency },
		}
		const baseURL: string = `transfers`
		const response = await postCircleAPICall(baseURL, payload)
		if (response?.code) {
			Logger.error(response.message)
			return null
		}
		const transactionObj: TransactionInterface = {
			id: uuid(),
			transaction_id: response.data.id,
			transaction_type: 'DEPOSIT_TRANSFER',
			source_wallet_type: 'wallet',
			source_wallet_id: merchantWalletId,
			destination_wallet_type: 'wallet',
			destination_wallet_id: userData.walletId,
			amount: parseFloat(response.data.amount.amount),
			currency: response.data.amount.currency,
			status: response.data.status,
			internalStatus: response.data.status, //  Testing
			userId: userData.id,
		}
		const transaction = await createTransactionService(transactionObj)
		if (transaction === null) {
			return null
		}
		return true
	} catch (err) {
		Logger.error(err)
	}
}
