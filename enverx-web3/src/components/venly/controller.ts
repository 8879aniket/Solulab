import { Request, Response, NextFunction } from 'express'
import Config from '@config/config'
import { Logger } from '@config/logger'
import Messages from '@helpers/messages'
import { toBuffer } from 'ethereumjs-util'
import axios from 'axios'
import { errorHandler, responseHandler } from '@helpers/responseHandlers'
import { getVenlyAPICall, postVenlyAPICall } from '@venly/venlyAPI'
import {
	mintGTPEncordAbiService,
	getNonce,
	constructMetaTransactionMessage,
	web3BN,
	transferEncordAbiService,
	mintVCCEncordAbiService,
	mintGTPService,
	checkGTPApprovalService,
	setApprovalForAllEncodeAbiService,
	swapEncodeAbiService,
	getSwapNonce,
} from '@websocket/blockchainEvent'

export const getChains = async (req: Request, res: Response) => {
	Logger.info('Inside Get Chains Controller')
	try {
		const baseURL: string = `${Config.VENLY.VENLY_URL}/chains`
		const response = await getVenlyAPICall(baseURL)
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
			msg: Messages.VENLY_CHAIN_FETCH_SUCCESS,
		})
	} catch (err) {
		Logger.error(err)
	}
}

export const createBlockchainWallet = async (req: Request, res: Response) => {
	Logger.info('Inside Create Blockchain Wallet Controller')
	try {
		const baseURL: string = `${Config.VENLY.VENLY_URL}/wallets`
		const { pinCode, description, identifier } = req.body
		const data = {
			pincode: pinCode,
			description: description,
			identifier: identifier,
			secretType: 'MATIC',
			walletType: 'WHITE_LABEL',
		}
		const response = await postVenlyAPICall(baseURL, data)
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
			msg: Messages.BLOCKCHAIN_WALLET_CREATE_SUCCESS,
		})
	} catch (err) {
		Logger.error(err)
	}
}

export const getBlockchainWallet = async (req: Request, res: Response) => {
	Logger.info('Inside Get Blockchain Wallet Controller')
	try {
		const { walletId } = req.params
		const baseURL: string = `${Config.VENLY.VENLY_URL}/wallets/${walletId}`
		const response = await getVenlyAPICall(baseURL)
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
			msg: Messages.VENLY_CHAIN_FETCH_SUCCESS,
		})
	} catch (err) {
		Logger.error(err)
	}
}

export const mintGTPMetaTransaction = async (req: Request, res: Response) => {
	Logger.info('Inside Mint GTP Meta Transaction Controller')
	try {
		const { pincode, walletId, walletAddress, amount, uri, unquieIdentifiers } = req.body
		const encodedAbi = await mintGTPEncordAbiService(walletAddress, amount, uri, unquieIdentifiers)
		const nonce = await getNonce(walletAddress)
		const contractAddress = Config.BLOCKCHAIN.GTP_CONTRACT_ADDRESS!
		const metaTransactionAPIId = Config.BLOCKCHAIN.BICONOMY_GTP_META_TRANSACTION_API_ID!
		const biconomy = await executeMetaTransaction(
			pincode,
			walletId,
			walletAddress,
			encodedAbi,
			nonce,
			contractAddress,
			metaTransactionAPIId
		)
		if (!biconomy) {
			return errorHandler({
				res,
				err: Messages.SOMETHING_WENT_WRONG,
				statusCode: 502,
			})
		}
		return responseHandler({
			res,
			data: biconomy,
			msg: Messages.MINT_REQUEST_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
	}
}

export const transferGTPMetaTransaction = async (req: Request, res: Response) => {
	Logger.info('Inside Transfer GTP Meta Transaction Token Controller')
	try {
		const { pincode, walletId, walletAddress, amount, from, to, id } = req.body
		const encodedAbi = await transferEncordAbiService(from, to, id, amount, '0x00')
		const nonce = await getNonce(walletAddress)
		const contractAddress = Config.BLOCKCHAIN.GTP_CONTRACT_ADDRESS!
		const metaTransactionAPIId = Config.BLOCKCHAIN.BICONOMY_GTP_META_TRANSACTION_API_ID!
		const biconomy = await executeMetaTransaction(
			pincode,
			walletId,
			walletAddress,
			encodedAbi,
			nonce,
			contractAddress,
			metaTransactionAPIId
		)
		if (!biconomy) {
			return errorHandler({
				res,
				err: Messages.SOMETHING_WENT_WRONG,
				statusCode: 502,
			})
		}
		return responseHandler({
			res,
			data: biconomy,
			msg: Messages.TRANSFER_TOKEN_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
	}
}

export const mintVCCMetaTransaction = async (req: Request, res: Response) => {
	Logger.info('Inside Mint VCC Meta Transaction Controller')
	try {
		const { pincode, walletId, walletAddress, tokenId, amount, uri, unquieIdentifiers } = req.body
		const gtpTokenAddress = Config.BLOCKCHAIN.GTP_CONTRACT_ADDRESS!
		const encodedAbi = await mintVCCEncordAbiService(
			gtpTokenAddress,
			tokenId,
			amount,
			uri,
			unquieIdentifiers
		)
		const nonce = await getNonce(walletAddress)
		const contractAddress = Config.BLOCKCHAIN.VCC_CONTRACT_ADDRESS!
		const metaTransactionAPIId = Config.BLOCKCHAIN.BICONOMY_VCC_META_TRANSACTION_API_ID!
		const biconomy = await executeMetaTransaction(
			pincode,
			walletId,
			walletAddress,
			encodedAbi,
			nonce,
			contractAddress,
			metaTransactionAPIId
		)
		if (!biconomy) {
			return errorHandler({
				res,
				err: Messages.SOMETHING_WENT_WRONG,
				statusCode: 502,
			})
		}
		return responseHandler({
			res,
			data: biconomy,
			msg: Messages.MINT_REQUEST_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
	}
}

export const checkApprovalMetaTransaction = async (
	userPincode: string,
	userWalletId: string,
	userWalletAddress: string
) => {
	Logger.info('Inside Check Approval Meta Transaction Controller')
	try {
		const swapContract = Config.BLOCKCHAIN.SWAP_CONTRACT_ADDRESS!
		const isApproved = await checkGTPApprovalService(userWalletAddress, swapContract)
		if (!isApproved) {
			const encodedAbi = await setApprovalForAllEncodeAbiService(swapContract)
			const nonce = await getNonce(userWalletAddress)
			const contractAddress = Config.BLOCKCHAIN.GTP_CONTRACT_ADDRESS!
			const metaTransactionAPIId = Config.BLOCKCHAIN.BICONOMY_GTP_META_TRANSACTION_API_ID!
			const biconomy = await executeMetaTransaction(
				userPincode,
				userWalletId,
				userWalletAddress,
				encodedAbi,
				nonce,
				contractAddress,
				metaTransactionAPIId
			)
			if (!biconomy) {
				return false
			}
			return true
		}
		return true
	} catch (error) {
		Logger.error(error)
		return false
	}
}

export const swapMetaTransaction = async (req: Request, res: Response) => {
	Logger.info('Inside Swap Meta Transaction Controller')
	try {
		const { pincode, walletId, walletAddress, tokenId, amount, offset } = req.body
		const approvalData = await checkApprovalMetaTransaction(pincode, walletId, walletAddress)
		if (!approvalData) {
			return errorHandler({
				res,
				err: Messages.SWAP_CONTRACT_APPROVE_FAILED,
				statusCode: 502,
			})
		}
		const encodedAbi = await swapEncodeAbiService(tokenId, amount, offset)
		const nonce = await getSwapNonce(walletAddress)
		const contractAddress = Config.BLOCKCHAIN.SWAP_CONTRACT_ADDRESS!
		const metaTransactionAPIId = Config.BLOCKCHAIN.BICONOMY_SWAP_META_TRANSACTION_API_ID
		const biconomy = await executeMetaTransaction(
			pincode,
			walletId,
			walletAddress,
			encodedAbi,
			nonce,
			contractAddress,
			metaTransactionAPIId
		)
		if (!biconomy) {
			return errorHandler({
				res,
				err: Messages.SOMETHING_WENT_WRONG,
				statusCode: 502,
			})
		}
		return responseHandler({
			res,
			data: biconomy,
			msg: Messages.MINT_REQUEST_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		return errorHandler({
			res,
			err: Messages.SOMETHING_WENT_WRONG,
			statusCode: 502,
		})
	}
}

export const mintGTP = async (req: Request, res: Response) => {
	Logger.info('Inside Mint GTP Controller')
	try {
		const { adminPincode, adminWalletId, developerWalletAddress, amount, uri, unquieIdentifiers } =
			req.body
		const contractAddress = Config.BLOCKCHAIN.GTP_CONTRACT_ADDRESS!
		const functionName = 'mint'
		const inputs = [
			{
				type: 'address',
				value: developerWalletAddress,
			},
			{
				type: 'uint256',
				value: parseInt(amount),
			},
			{
				type: 'string',
				value: uri,
			},
			{
				type: 'string',
				value: unquieIdentifiers,
			},
		]
		const response = await executeContract(
			adminPincode,
			adminWalletId,
			contractAddress,
			functionName,
			inputs
		)
		if (response === false) {
			return errorHandler({
				res,
				err: Messages.INSUFFICIENT_FUND,
				statusCode: 502,
			})
		}
		if (!response) {
			return errorHandler({
				res,
				err: Messages.SOMETHING_WENT_WRONG,
				statusCode: 502,
			})
		}
		return responseHandler({
			res,
			data: { response },
			msg: Messages.MINT_REQUEST_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		return errorHandler({
			res,
			err: Messages.SOMETHING_WENT_WRONG,
			statusCode: 502,
		})
	}
}

export const transferGTP = async (req: Request, res: Response) => {
	Logger.info('Inside Transfer GTP Token Controller')
	try {
		const { adminPincode, adminWalletId, amount, from, to, id } = req.body
		const contractAddress = Config.BLOCKCHAIN.GTP_CONTRACT_ADDRESS!
		const functionName = 'safeTransferFrom'
		const inputs = [
			{
				type: 'address',
				value: from,
			},
			{
				type: 'address',
				value: to,
			},
			{
				type: 'uint256',
				value: parseInt(id),
			},
			{
				type: 'uint256',
				value: parseInt(amount),
			},
			{
				type: 'bytes',
				value: '0x00',
			},
		]
		const response = await executeContract(
			adminPincode,
			adminWalletId,
			contractAddress,
			functionName,
			inputs
		)
		if (response === false) {
			return errorHandler({
				res,
				err: Messages.INSUFFICIENT_FUND,
				statusCode: 502,
			})
		}
		if (!response) {
			return errorHandler({
				res,
				err: Messages.SOMETHING_WENT_WRONG,
				statusCode: 502,
			})
		}
		return responseHandler({
			res,
			data: response,
			msg: Messages.TRANSFER_TOKEN_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		return errorHandler({
			res,
			err: Messages.SOMETHING_WENT_WRONG,
			statusCode: 502,
		})
	}
}

export const mintVCC = async (req: Request, res: Response) => {
	Logger.info('Inside Mint VCC Controller')
	try {
		const { adminPincode, adminWalletId, tokenId, amount, uri, unquieIdentifiers } = req.body
		const gtpTokenAddress = Config.BLOCKCHAIN.GTP_CONTRACT_ADDRESS!
		const contractAddress = Config.BLOCKCHAIN.VCC_CONTRACT_ADDRESS!
		const functionName = 'mintVCCTokens'
		const inputs = [
			{
				type: 'address',
				value: gtpTokenAddress,
			},
			{
				type: 'uint256',
				value: parseInt(tokenId),
			},
			{
				type: 'uint256',
				value: parseInt(amount),
			},
			{
				type: 'string',
				value: uri,
			},
			{
				type: 'string',
				value: unquieIdentifiers,
			},
		]
		const response = await executeContract(
			adminPincode,
			adminWalletId,
			contractAddress,
			functionName,
			inputs
		)
		if (response === false) {
			return errorHandler({
				res,
				err: Messages.INSUFFICIENT_FUND,
				statusCode: 502,
			})
		}
		if (!response) {
			return errorHandler({
				res,
				err: Messages.SOMETHING_WENT_WRONG,
				statusCode: 502,
			})
		}
		return responseHandler({
			res,
			data: response,
			msg: Messages.TRANSFER_TOKEN_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		return errorHandler({
			res,
			err: Messages.SOMETHING_WENT_WRONG,
			statusCode: 502,
		})
	}
}

export const executeContract = async (
	adminPincode: string,
	adminWalletId: string,
	contractAddress: string,
	functionName: string,
	inputs: any
) => {
	Logger.info('Inside Transfer GTP Token Controller')
	try {
		const baseURL: string = `${Config.VENLY.VENLY_URL}/transactions/execute`
		const body = {
			pincode: adminPincode,
			transactionRequest: {
				walletId: adminWalletId,
				type: 'CONTRACT_EXECUTION',
				to: contractAddress,
				secretType: 'MATIC',
				functionName: functionName,
				value: 0,
				inputs,
			},
		}
		const response = await postVenlyAPICall(baseURL, body)
		if (response?.code) {
			return false
		}
		return response
	} catch (error) {
		Logger.error(error)
	}
}

export const executeMetaTransaction = async (
	pincode: any,
	walletId: any,
	walletAddress: any,
	encodedAbi: any,
	nonce: any,
	contractAddress: any,
	metaTransactionAPIId: any
) => {
	Logger.info('Inside Execute Meta Transaction Service')
	try {
		const baseURL: string = `${Config.VENLY.VENLY_URL}/signatures`
		const signetureData = constructMetaTransactionMessage(
			parseInt(nonce),
			parseInt(Config.BLOCKCHAIN.CHAIN_ID!),
			encodedAbi,
			contractAddress
		)?.toString('hex')
		const data = {
			pincode: pincode,
			signatureRequest: {
				type: 'MESSAGE',
				secretType: 'MATIC',
				walletId: walletId,
				data: `0x${signetureData}`,
			},
		}
		Logger.info(`BaseURL Controller:- ${baseURL}`)
		const response = await postVenlyAPICall(baseURL, data)
		const body = {
			to: contractAddress,
			apiId: metaTransactionAPIId,
			params: [
				walletAddress,
				encodedAbi,
				response.result.r,
				response.result.s,
				web3BN(response.result.v).toNumber(),
			],
			from: walletAddress,
		}
		const options = {
			method: 'POST',
			headers: {
				'x-api-key': Config.BLOCKCHAIN.BICONOMY_DAPP_API_KEY!,
				'Content-Type': 'application/json;charset=utf-8',
			},
			body,
			data: body,
		}
		const biconomyData: any = await axios(Config.BLOCKCHAIN.BICONOMY_URL!, options).catch(
			(error) => {
				Logger.error(error)
				return false
			}
		)
		if (!biconomyData) {
			return false
		}
		return biconomyData.data
	} catch (error) {
		Logger.error(error)
	}
}

export const getBlockchainWalletTransactions = async (req: Request, res: Response) => {
	Logger.info('Inside get Wallet Transactions controller')
	try {
		const baseURL: string = `${Config.VENLY.VENLY_URL}/wallets/${req.params.walletId}/events`
		const response = await getVenlyAPICall(baseURL)
		if (!response)
			return errorHandler({
				res,
				err: Messages.SOMETHING_WENT_WRONG,
				statusCode: 502,
			})

		return responseHandler({
			res,
			data: response,
			msg: Messages.GET_BLOCKCHAIN_WALLET_TRANSACTIONS_SUCCESS,
		})
	} catch (err) {
		Logger.error(err)
		return errorHandler({
			res,
			err: Messages.SOMETHING_WENT_WRONG,
			statusCode: 502,
		})
	}
}
