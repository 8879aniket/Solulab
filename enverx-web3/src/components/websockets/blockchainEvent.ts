import Web3 from 'web3'
import abi from 'ethereumjs-abi'
import { toBuffer } from 'ethereumjs-util'
import axios from 'axios'
import Config from '@config/config'
import { Logger } from '@config/logger'
import gtpToken from '@abis/GTPTokenFactory.json'
import vccContractAbi from '@abis/VCCContractABI.json'
import swapContractAbi from '@abis/SWAPContractABI.json'
import {
	createTransaction,
	updateTransactionByHash,
	createVCCTransaction,
} from '@transactions/service'
import TransactionInterface from '@interfaces/transaction'
import VCCTransactionInterface from '@interfaces/vccTransaction'
import { v4 as uuid } from 'uuid'

const options = {
	timeout: 30000,

	clientConfig: {
		maxReceivedMessageSize: 100000000,
		keepalive: true,
		keepaliveInterval: -1,
	},
	reconnect: {
		auto: true,
		delay: 1000,
		maxAttempts: 10,
		onTimeout: false,
	},
}

const gtp: any = gtpToken
const vcc: any = vccContractAbi
const swap: any = swapContractAbi

const web3Polygon = new Web3(
	new Web3.providers.WebsocketProvider(Config.BLOCKCHAIN.RPC_SOCKET_URL!, options)
)
const GTPInstance = new web3Polygon.eth.Contract(gtp, Config.BLOCKCHAIN.GTP_CONTRACT_ADDRESS)
const VCCInstance = new web3Polygon.eth.Contract(vcc, Config.BLOCKCHAIN.VCC_CONTRACT_ADDRESS)
const SWAPInstance = new web3Polygon.eth.Contract(swap, Config.BLOCKCHAIN.SWAP_CONTRACT_ADDRESS)

GTPInstance.events.Mint(
	{
		fromBlock: 'latest',
	},
	async (error: any, event: any) => {
		try {
			Logger.info('Inside Mint Token Event')

			if (error) {
				Logger.error('Inside Mint Token Error')
				Logger.error('error', error)
			}
			const txObject: TransactionInterface = {
				id: uuid(),
				txHash: event.transactionHash,
				userWalletAddress: event.returnValues.receiver,
				tokenQuantity: event.returnValues.amount,
				uri: event.returnValues.uri,
				eventType: 'Mint',
				projectTokenId: event.returnValues.tokenId,
				projectId: event.returnValues.uniqueIdentifier,
			}
			await createTransaction(txObject)
			const transactionObj = {
				txHash: event.transactionHash,
				tokenId: event.returnValues.tokenId,
			}
			await axios
				.put(`${Config.BACKEND_PLATFORM.UPDATE_PROJECT_TRANSACTION}`, transactionObj)
				.catch((err) => {
					Logger.error(err)
					return false
				})!
		} catch (err) {
			Logger.error(error)
		}
	}
)

GTPInstance.events.TransferSingle(
	{
		fromBlock: 'latest',
	},
	async (error: any, event: any) => {
		try {
			Logger.info('Inside Transfer Token Event')

			if (error) {
				Logger.error('Inside Transfer Token Error')
				Logger.error('error', error)
			}
			if (event.returnValues.to !== '0x0000000000000000000000000000000000000000') {
				if (event.returnValues.from === '0x0000000000000000000000000000000000000000') {
					await updateTransactionByHash(
						event.transactionHash,
						event.returnValues.from,
						event.returnValues.to
					)
				} else {
					const txObject: TransactionInterface = {
						id: uuid(),
						txHash: event.transactionHash,
						userWalletAddress: event.returnValues.operator,
						tokenQuantity: event.returnValues.value,
						eventType: 'Transfer',
						projectTokenId: event.returnValues.id,
						fromWalletAddress: event.returnValues.from,
						toWalletAddress: event.returnValues.to,
					}
					await createTransaction(txObject)
				}
				const transactionObj = {
					txHash: event.transactionHash,
					tokenId: event.returnValues.id,
					from: event.returnValues.from,
					to: event.returnValues.to,
					amount: event.returnValues.value,
				}
				if (event.returnValues.to === Config.BLOCKCHAIN.SWAP_CONTRACT_ADDRESS) {
					await axios
						.post(`${Config.BACKEND_PLATFORM.CREATE_TOKEN_TRANSACTION_AFTER_SWAP}`, transactionObj)
						.catch((err) => {
							Logger.error(err)
							return false
						})!
				} else {
					await axios
						.post(`${Config.BACKEND_PLATFORM.CREATE_TOKEN_TRANSACTION}`, transactionObj)
						.catch((err) => {
							Logger.error(err)
							return false
						})!
				}
			}
		} catch (err) {
			Logger.error(error)
		}
	}
)

VCCInstance.events.VCCTokenMinted(
	{
		fromBlock: 'latest',
	},
	async (error: any, event: any) => {
		try {
			Logger.info('Inside Mint VCC Token Event')

			if (error) {
				Logger.error('Inside Mint VCC Token Error')
				Logger.error('error', error)
			}
			const txObject: VCCTransactionInterface = {
				id: uuid(),
				txHash: event.transactionHash,
				tokenQuantity: event.returnValues.amountMinted,
				uri: event.returnValues.tokenURI,
				eventType: 'MintVCC',
				projectTokenId: event.returnValues.projectTokenId,
				projectId: event.returnValues.uniqueIdentifier,
			}
			await createVCCTransaction(txObject)
			const vccTransactionObj = {
				txHash: event.transactionHash,
				tokenQuantity: event.returnValues.amountMinted,
				tokenId: event.returnValues.projectTokenId,
				projectId: event.returnValues.uniqueIdentifier,
				uri: event.returnValues.tokenURI,
			}
			await axios
				.put(`${Config.BACKEND_PLATFORM.UPDATE_VCC_TRANSACTION}`, vccTransactionObj)
				.catch((err) => {
					Logger.error(err)
					return false
				})!
		} catch (err) {
			Logger.error(error)
		}
	}
)

SWAPInstance.events.SwapSucess(
	{
		fromBlock: 'latest',
	},
	async (error: any, event: any) => {
		try {
			Logger.info('Inside SWAP Token Event')

			if (error) {
				Logger.error('Inside SWAP Token Error')
				Logger.error('error', error)
			}
			const txObject: VCCTransactionInterface = {
				id: uuid(),
				txHash: event.transactionHash,
				tokenQuantity: event.returnValues.amount,
				eventType: 'Transfer',
				projectTokenId: event.returnValues.tokenId,
				startIndex: event.returnValues.startIndex,
				fromWalletAddress: Config.BLOCKCHAIN.SWAP_CONTRACT_ADDRESS,
				toWalletAddress: event.returnValues.reciever,
			}
			await createVCCTransaction(txObject)
			const vccTransactionObj = {
				transactionHash: event.transactionHash,
				tokenId: event.returnValues.tokenId,
				amount: parseInt(event.returnValues.amount),
				startIndex: parseInt(event.returnValues.startIndex),
				from: Config.BLOCKCHAIN.SWAP_CONTRACT_ADDRESS,
				to: event.returnValues.reciever,
			}
			await axios
				.post(`${Config.BACKEND_PLATFORM.CREATE_VCC_TOKEN_TRANSACTION}`, vccTransactionObj)
				.catch((err) => {
					Logger.error(err)
					return false
				})!
		} catch (err) {
			Logger.error(error)
		}
	}
)

export const mintGTPService = async (
	walletAddress: string,
	amount: number,
	uri: string,
	unquieIdentifiers: string
) => {
	Logger.info('Inside Mint GTP Service')
	try {
		const mintData = await GTPInstance.methods
			.mint(walletAddress, amount, uri, unquieIdentifiers)
			.send({ from: '0xEA83c80fD1F125571dA522b374D70b6d6Ab51827' })
		console.log(mintData)
		return true
	} catch (error) {
		Logger.error(error)
		return false
	}
}

export const mintGTPEncordAbiService = async (
	walletAddress: string,
	amount: number,
	uri: string,
	unquieIdentifiers: string
) => {
	Logger.info('Inside Mint GTP Encord ABI Service')
	try {
		const encodeAbi = await GTPInstance.methods
			.mint(walletAddress, amount, uri, unquieIdentifiers)
			.encodeABI()
		return encodeAbi
	} catch (err) {
		Logger.error(err)
	}
}

export const mintVCCEncordAbiService = async (
	gtpTokenAddress: string,
	tokenId: number,
	amount: number,
	uri: string,
	unquieIdentifiers: string
) => {
	Logger.info('Inside Mint VCC Encord ABI Service')
	try {
		const encodeAbi = await VCCInstance.methods
			.mintVCCTokens(gtpTokenAddress, tokenId, amount, uri, unquieIdentifiers)
			.encodeABI()
		return encodeAbi
	} catch (err) {
		Logger.error(err)
	}
}

export const transferEncordAbiService = async (
	from: string,
	to: string,
	id: string,
	amount: number,
	data: string
) => {
	Logger.info('Inside Transfer Token Encord ABI Service')
	try {
		const encodeAbi = await GTPInstance.methods
			.safeTransferFrom(from, to, id, amount, data)
			.encodeABI()
		return encodeAbi
	} catch (err) {
		Logger.error(err)
	}
}

export const setApprovalForAllEncodeAbiService = async (address: string) => {
	Logger.info('InsideSet Approval For All Encord ABI Service')
	try {
		const encodeAbi = await GTPInstance.methods.setApprovalForAll(address, true).encodeABI()
		return encodeAbi
	} catch (err) {
		Logger.error(err)
		return false
	}
}

export const swapEncodeAbiService = async (tokenId: number, quantity: number, offset: boolean) => {
	Logger.info('Inside Set Approval For All Encord ABI Service')
	try {
		const encodeAbi = await SWAPInstance.methods.swap(tokenId, quantity, offset).encodeABI()
		return encodeAbi
	} catch (err) {
		Logger.error(err)
		return false
	}
}

export const getNonce = async (walletAddrss: string) => {
	Logger.info('Inside Get Nonce service')
	try {
		const currentNonce = await GTPInstance.methods.getNonce(walletAddrss).call()
		return currentNonce
	} catch (err) {
		Logger.error(err)
	}
}

export const getSwapNonce = async (walletAddrss: string) => {
	Logger.info('Inside Get Swap Nonce service')
	try {
		const currentNonce = await SWAPInstance.methods.getNonce(walletAddrss).call()
		return currentNonce
	} catch (err) {
		Logger.error(err)
	}
}

export const checkGTPApprovalService = async (accountAddress: string, operatorAddress: string) => {
	Logger.info('Inside Get Nonce service')
	try {
		const getApprovalStatus = await GTPInstance.methods
			.isApprovedForAll(accountAddress, operatorAddress)
			.call()
		return getApprovalStatus
	} catch (err) {
		Logger.error(err)
	}
}

export const web3BN = web3Polygon.utils.toBN

export const constructMetaTransactionMessage = (
	nonce: number,
	chainId: number,
	functionSignature: string,
	contractAddress: string
) => {
	Logger.info('Inside Construct Meta Transaction Message Service')
	try {
		const metaTransactionData = abi.soliditySHA3(
			['uint256', 'address', 'uint256', 'bytes'],
			[nonce, contractAddress, chainId, toBuffer(functionSignature)]
		)
		return metaTransactionData
	} catch (err) {
		Logger.error(err)
	}
}
