import { v4 as uuid } from 'uuid'
import { postCircleAPICall } from '@circlePayment/circleAPI'
import { TransactionInterface } from '@interfaces/transaction'
import { Logger } from '@config/logger'
import { Op } from 'sequelize'
import Transactions from '@circlePayment/transection.model'
import User from '@dummy/user/user.model'

export const createTransactionService = async (data: TransactionInterface) => {
	Logger.info('Inside create Transaction service')
	try {
		const transaction = await Transactions.create({
			id: data.id,
			transaction_id: data.transaction_id,
			transaction_type: data.transaction_type,
			tracking_ref: data.tracking_ref,
			source_wallet_type: data.source_wallet_type,
			source_wallet_id: data.source_wallet_id,
			destination_wallet_type: data.destination_wallet_type,
			destination_wallet_id: data.destination_wallet_id,
			amount: data.amount,
			currency: data.currency,
			status: data.status,
			internalStatus: data.status,
			bankName: data.bankName,
			// isInvestmentSuccess: data.isInvestmentSuccess,
			// investmentTransactionHash: data.investmentTransactionHash,
			userId: data.userId,
		})
		if (!transaction) {
			return null
		}
		return transaction
	} catch (err) {
		Logger.error(err)
		throw err
	}
}

export const getTransactionService = async (
	userId: string,
	trackingRef: string,
	amountData: number,
	currency: string,
	transactionStatus: string,
	transactionType: string
) => {
	Logger.info('Inside Get Transaction service')
	try {
		const transactionData = await Transactions.findOne({
			where: {
				userId,
				tracking_ref: trackingRef,
				amount: amountData,
				currency,
				status: transactionStatus,
				transaction_type: transactionType,
			},
		})
		return transactionData
	} catch (err) {
		Logger.error(err)
		throw err
	}
}

export const getAllTransaction = async (
	userId: string,
	offset: number,
	limit: number,
	orderBy: string,
	orderType: string,
	status: string,
	type: string,
	date: string
) => {
	Logger.info('Inside Get All Transaction service')
	try {
		let options: any = {
			offset,
			limit,
			where: { userId },
			order: [[orderBy, orderType]],
			include: [{ model: User }],
		}
		options.where.transaction_type = {
			[Op.in]: ['PAYMENT', 'PAYOUT', 'TRANSFER'],
		}
		if (status !== '') {
			options.where.internalStatus = status
		}
		if (type !== '') {
			switch (type) {
				case 'deposit': {
					options.where.transaction_type = 'PAYMENT'
					break
				}
				case 'withdraw': {
					options.where.transaction_type = 'PAYOUT'
					break
				}
				case 'transfer': {
					options.where.transaction_type = 'TRANSFER'
				}
				default:
					break
			}
		}
		if (date !== '') {
			options.where.createdAt = {
				[Op.lte]: new Date(new Date(date).getTime() + 60 * 60 * 24 * 1000 - 1),
				[Op.gte]: new Date(date),
			}
		}
		const transactionData = await Transactions.findAndCountAll(options)
		return transactionData
	} catch (err) {
		Logger.error(err)
		throw err
	}
}

export const getPlatformTransactionHistoryService = async (
	offset: number,
	limit: number,
	searchText: string,
	txn: string,
	statusData: string,
	stDate: string,
	enDate: string
) => {
	Logger.info('Inside Get Platform Transaction History service')
	try {
		let options: any = {
			offset,
			limit,
			where: {},
		}
		if (searchText !== '') {
			options.where = {
				[Op.or]: {
					transaction_type: {
						[Op.iLike]: `%${searchText}%`,
					},
					source_wallet_id: {
						[Op.iLike]: `%${searchText}%`,
					},
					destination_wallet_id: {
						[Op.iLike]: `%${searchText}%`,
					},
				},
			}
		}
		if (txn !== '') {
			options.where.transaction_type = txn
		}
		if (statusData !== '') {
			options.where.status = statusData
		}
		if (stDate !== '') {
			options.where.createdAt = {
				[Op.lte]: new Date(new Date(enDate).getTime() + 60 * 60 * 24 * 1000 - 1),
				[Op.gte]: new Date(stDate),
			}
		}
		const transactionData = await Transactions.findAndCountAll(options)
		return transactionData
	} catch (err) {
		Logger.error(err)
		throw err
	}
}

export const getAllTransactionByWalletIdService = async (walletId: string) => {
	try {
		Logger.info('Inside Get All Transaction By Wallet Id service')
		const transactionData = await Transactions.findAll({
			where: { destination_wallet_id: walletId, status: 'complete' },
		})
		return transactionData
	} catch (err) {
		Logger.error(err)
		throw err
	}
}

export const updateTransactionService = async (transactionId: string, tokenStatus: string) => {
	try {
		Logger.info('Inside Update Transaction service')
		await Transactions.update(
			{ tokenTransferedStatus: tokenStatus },
			{ where: { transaction_id: transactionId } }
		)
		return true
	} catch (err) {
		Logger.error(err)
		throw err
	}
}

export const cronTransferFundToInvestorIfGTPFailed = async () => {
	try {
		Logger.info('Inside Cron job Transfer Fund To Investor service')
		const transactionData = await Transactions.findAll({
			where: { tokenTransferedStatus: 'failed' },
		})
		transactionData.forEach(async (ele) => {
			const payload = {
				idempotencyKey: uuid(),
				source: { id: ele.destination_wallet_id, type: 'wallet' },
				destination: { id: ele.source_wallet_id, type: 'wallet' },
				amount: { amount: ele.amount.toString(), currency: 'USD' },
			}
			const baseURL: string = `transfers`
			const response = await postCircleAPICall(baseURL, payload)
			if (response?.code) {
				return false
			}
			const transactionObj: TransactionInterface = {
				id: uuid(),
				transaction_id: response.data.id,
				transaction_type: 'TRANSFER',
				source_wallet_type: 'wallet',
				source_wallet_id: ele.destination_wallet_id,
				destination_wallet_type: 'wallet',
				destination_wallet_id: ele.source_wallet_id,
				amount: parseFloat(response.data.amount.amount),
				currency: response.data.amount.currency,
				status: response.data.status,
				internalStatus: response.data.status,
				userId: ele.userId,
			}
			const transaction = await createTransactionService(transactionObj)
			if (transaction === null) {
				return false
			}
			await Transactions.update(
				{ tokenTransferedStatus: 'refunded' },
				{ where: { transaction_id: ele.transaction_id } }
			)
		})
		return true
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}
