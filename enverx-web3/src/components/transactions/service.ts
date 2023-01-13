import Transactions from '@transactions/transactions.model'
import VCCTransaction from './vccTransactions.model'
import { Logger } from '@config/logger'
import TransactionInterface from '@interfaces/transaction'
import VCCTransactionInterface from '@interfaces/vccTransaction'

export const createTransaction = async (txObject: TransactionInterface) => {
	Logger.info('Inside create Transaction service')
	try {
		const txData = await Transactions.create(txObject)
		if (!txData) {
			return false
		}
		return txData
	} catch (error) {
		Logger.error(error)
	}
}

export const createVCCTransaction = async (txObject: VCCTransactionInterface) => {
	Logger.info('Inside create VCC Transaction service')
	try {
		const txData = await VCCTransaction.create(txObject)
		if (!txData) {
			return false
		}
		return txData
	} catch (error) {
		Logger.error(error)
	}
}

export const updateTransactionByHash = async (
	txHash: string,
	fromAddress: string,
	toAddress: string
) => {
	Logger.info('Inside update Transaction By Hash service')
	try {
		const txData = await Transactions.findOne({ where: { txHash } })
		if (!txData) {
			return false
		}
		txData.fromWalletAddress = fromAddress
		txData.toWalletAddress = toAddress
		await txData.save()
		return txData
	} catch (error) {
		Logger.error(error)
	}
}
