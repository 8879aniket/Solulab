import Web3 from 'web3'
import fs from 'fs'
import Web3WsProvider from 'web3-providers-ws'
import path from 'path'
import { fileURLToPath } from 'url'
import config from '../../config/config.js'
import logger from '../../config/logger.js'
import Fragment from '../fragment/fragmentModel.js'
import User from '../user/userModel.js'
import factory from '../commonServices.js'
import Activity from '../history/activityModel.js'
import SellFragsments from '../fragment/sellFragmentModel.js'
import TradingHistory from '../history/tradingHistoryModel.js'
import { generatorNotification } from '../notification/notificationService.js'
import { updateCoordinate } from '../../helpers/generateCoordinate.js'
import Landing from '../user/landingModel.js'
import Coordinate from '../fragment/coordinateModel.js'
// eslint-disable-next-line import/no-cycle
import processQueue from '../../helpers/processQueue.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const mintNFT = JSON.parse(
	// eslint-disable-next-line security/detect-non-literal-fs-filename
	fs.readFileSync(`${__dirname}/../../../artifacts/contracts/MintNFT.sol/MintNFT.json`)
)
const marketPlace = JSON.parse(
	// eslint-disable-next-line security/detect-non-literal-fs-filename
	fs.readFileSync(
		`${__dirname}/../../../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json`
	)
)
const oneForge = JSON.parse(
	// eslint-disable-next-line security/detect-non-literal-fs-filename
	fs.readFileSync(`${__dirname}/../../../artifacts/contracts/OneForge.sol/OneForge.json`)
)
const options = {
	timeout: 30000, // ms

	clientConfig: {
		// Useful if requests are large
		maxReceivedFrameSize: 100000000, // bytes - default: 1MiB
		maxReceivedMessageSize: 100000000, // bytes - default: 8MiB

		// Useful to keep a connection alive
		keepalive: true,
		keepaliveInterval: -1, // ms
	},

	// Enable auto reconnection
	reconnect: {
		auto: true,
		delay: 1000, // ms
		maxAttempts: 10,
		onTimeout: false,
	},
}

const web3Polygon = new Web3(new Web3WsProvider(config.polygonURL, options))

const NFTInstance = new web3Polygon.eth.Contract(mintNFT.abi, config.contractAddress.onecoinNFTMint)
const MarketPlace = new web3Polygon.eth.Contract(
	marketPlace.abi,
	config.contractAddress.onecoinMarketPlace
)
const OneForge = new web3Polygon.eth.Contract(oneForge.abi, config.contractAddress.onecoinOneForge)

NFTInstance.events.CreateNFT(
	{
		fromBlock: 'latest',
	},
	async (error, event) => {
		try {
			logger.info('Inside Mint Event')
			const { transactionHash, returnValues } = event
			const { user, metaData, x, y, z, encodeTokenID } = returnValues
			await processQueue.add({ transactionHash, user, metaData, x, y, z, encodeTokenID })

			if (error) {
				logger.error('Inside Mint Event')
				logger.error('error', error)
			}
		} catch (err) {
			logger.error(error)
		}
	}
)

const mintNFt = async (data) => {
	try {
		const { transactionHash, user, metaData, x, y, z, encodeTokenID } = data
		const userData = await factory.getOne(User, { walletAddress: user })
		const fragmentObject = {
			name: encodeTokenID,
			// price: { type: Number },
			// fragmentIPFS: { type: Array, default: [] },
			xCoordinate: x,
			yCoordinate: y,
			zCoordinate: z,
			tokenID: encodeTokenID,
			transactionHash,
			ownerWalletAddress: user,
			description: metaData,
			currentOwner: userData._id,
			createdBy: userData._id,
			mergeCoordinate: [{ x: Number(x), y: Number(y), z: Number(z) }],
		}
		const fragmentData = await factory.createOne(Fragment, fragmentObject)
		const activityObject = {
			buyer: userData._id,
			createdBy: userData._id,
			fragmentId: fragmentData._id,
			event: 'mint',
		}
		await updateCoordinate(x, y, z)
		await factory.createOne(Activity, activityObject)
		const fragmentCount = userData.totalFragment + 1
		await factory.updateOne(User, { _id: userData._id }, { totalFragment: fragmentCount })
		const landingData = await factory.getOne(Landing)
		await factory.updateOne(Landing, { _id: landingData._id }, { $inc: { totalFragment: 1 } })
		await generatorNotification({
			description: `You have minted a NFT. Click the link below for more details.`,
			generatorId: userData._id,
			receiverId: userData._id,
			itemId: fragmentData._id,
			type: 'Fragments',
		})
	} catch (e) {
		logger.error(e)
	}
}

MarketPlace.events.SellNFTForFloatPrice(
	{
		fromBlock: 'latest',
	},
	async (error, event) => {
		try {
			logger.info('Inside SellFloatPrice Event')
			const { returnValues } = event
			let { price } = returnValues
			const { sellerAddress, tokenId, id } = returnValues

			price /= 10 ** 18

			const userData = await factory.getOne(User, { walletAddress: sellerAddress })

			const updateFragment = await factory.updateOne(
				Fragment,
				{ tokenID: tokenId },
				{ isAtMarketPlace: true, blockchainId: id, price, floatInitialPrice: price }
			)

			const sellFragment = await factory.createOne(SellFragsments, {
				fragmentId: updateFragment._id,
				currentOwner: updateFragment.currentOwner,
				sellType: 'variable',
				price,
			})

			const activityObject = {
				buyer: userData._id,
				seller: userData._id,
				createdBy: userData._id,
				price: sellFragment.price,
				fragmentId: updateFragment._id,
				event: 'list',
			}

			await factory.createOne(Activity, activityObject)

			const tradeObj = {
				buyer: userData._id,
				fragmentId: updateFragment._id,
				sellType: 'variable price',
				price,
				event: 'list',
			}

			await factory.createOne(TradingHistory, tradeObj)

			if (error) {
				logger.error('Inside putTokenOnsale Event')
				logger.error('error', error)
			}
		} catch (err) {
			logger.error(error)
		}
	}
)

MarketPlace.events.ChangeFloatPrice(
	{
		fromBlock: 'latest',
	},
	async (error, event) => {
		try {
			logger.info('Inside ChangeFloatingPrice Event')
			let { changedPrice } = event.returnValues
			const { tokenId } = event.returnValues
			changedPrice /= 10 ** 18
			const fragment = await factory.updateOne(
				Fragment,
				{ tokenID: tokenId },
				{ price: changedPrice }
			)
			await factory.updateOne(
				SellFragsments,
				{ fragmentId: fragment._id },
				{ price: changedPrice }
			)
			const activityObject = {
				buyer: fragment.currentOwner,
				seller: fragment.currentOwner,
				createdBy: fragment.currentOwner,
				price: changedPrice,
				fragmentId: fragment._id,
				event: 'list',
			}

			await factory.createOne(Activity, activityObject)

			await generatorNotification({
				description: `Price has been changes for the NFT ${fragment?.name}. Please click the link below for more details.`,
				generatorId: fragment.currentOwner,
				receiverId: fragment.currentOwner,
				itemId: fragment._id,
				type: 'Fragments',
			})

			if (error) {
				logger.error('Inside putTokenOnsale Event')
				logger.error('error', error)
			}
		} catch (err) {
			logger.error(err)
		}
	}
)

MarketPlace.events.SellNFT(
	{
		fromBlock: 'latest',
	},
	async (error, event) => {
		try {
			logger.info('Inside Sell Event')
			const { returnValues } = event
			let { price } = returnValues
			const { sellerAddress, tokenId, id } = returnValues

			price /= 10 ** 18
			const userData = await factory.getOne(User, { walletAddress: sellerAddress })

			const updateFragment = await factory.updateOne(
				Fragment,
				{ tokenID: tokenId },
				{ isAtMarketPlace: true, blockchainId: id, price }
			)

			const sellFragment = await factory.createOne(SellFragsments, {
				fragmentId: updateFragment._id,
				currentOwner: updateFragment.currentOwner,
				sellType: 'fixed',
				price,
			})

			const activityObject = {
				buyer: userData._id,
				seller: userData._id,
				createdBy: userData._id,
				price: sellFragment.price,
				fragmentId: updateFragment._id,
				event: 'list',
			}

			await factory.createOne(Activity, activityObject)

			const tradeObj = {
				buyer: userData._id,
				fragmentId: updateFragment._id,
				sellType: 'fixed price',
				price,
				event: 'list',
			}

			await factory.createOne(TradingHistory, tradeObj)

			// // create notification

			await generatorNotification({
				description: `You have put your Grid NFT to sell. Please click the link below for more details.`,
				generatorId: userData._id,
				receiverId: userData._id,
				itemId: updateFragment._id,
				type: 'Fragments',
			})

			if (error) {
				logger.error('Inside putTokenOnsale Event')
				logger.error('error', error)
			}
		} catch (err) {
			logger.error(error)
		}
	}
)

MarketPlace.events.RemoveNFT(
	{
		fromBlock: 'latest',
	},
	async (error, event) => {
		logger.info('Inside RemoveNFTFromSale Event')
		logger.info('event', event)
		const { tokenId } = event.returnValues

		const findItem = await factory.updateOne(
			Fragment,
			{ tokenID: tokenId },
			{ isAtMarketPlace: false }
		)
		await factory.deleteOne(SellFragsments, { fragmentId: findItem._id })
		const activityObject = {
			buyer: findItem.currentOwner,
			seller: findItem.currentOwner,
			createdBy: findItem.currentOwner,
			price: findItem.price,
			fragmentId: findItem._id,
			event: 'list',
		}

		await factory.createOne(Activity, activityObject)
		if (error) {
			logger.error('Inside RemoveNFTFromSale Event')
			logger.error('error', error)
		}
	}
)

MarketPlace.events.BuyNFT(
	{
		fromBlock: 'latest',
	},
	async (error, event) => {
		try {
			logger.info('Inside BuyToken Event')
			let { price } = event.returnValues
			const { tokenId, userAddr, sellerAddr } = event.returnValues
			price /= 10 ** 18
			const buyerData = await factory.getOne(User, { walletAddress: userAddr })
			const buyerFragmentCount = buyerData.totalFragment + 1
			const sellerData = await factory.getOne(User, { walletAddress: sellerAddr })
			const sellerFragmentCount = sellerData.totalFragment - 1
			const fragment = await factory.getOne(Fragment, { tokenID: tokenId })
			await factory.updateOne(
				Fragment,
				{ _id: fragment._id },
				{
					currentOwner: buyerData._id,
					price,
					isAtMarketPlace: false,
					ownerWalletAddress: userAddr,
				}
			)
			await factory.updateOne(
				User,
				{ _id: buyerData._id },
				{ totalFragment: buyerFragmentCount }
			)

			await factory.updateOne(SellFragsments, { fragmentId: fragment._id }, { isSold: true })
			const activityObject = {
				seller: sellerData._id,
				buyer: buyerData._id,
				createdBy: sellerData._id,
				fragmentId: fragment._id,
				price,
				event: 'transfer',
			}
			await factory.createOne(Activity, activityObject)
			const historyObject = {
				seller: sellerData._id,
				buyer: buyerData._id,
				fragmentId: fragment._id,
				price,
				event: 'sale',
			}
			const payoutPercent = await factory.getOne(Landing)
			const pay = Number((price / 100) * payoutPercent.platformSplit)

			await factory.updateOne(Landing, { _id: payoutPercent._id }, { $inc: { payout: pay } })
			await factory.updateOne(
				User,
				{ _id: sellerData._id },
				{ totalFragment: sellerFragmentCount, $inc: { totalRoyalties: pay } }
			)
			await factory.createOne(TradingHistory, historyObject)

			if (sellerData.notificationSetting?.nftSold)
				await generatorNotification({
					description: `Your Grid NFT is bought by ${buyerData.name} at the price of ${price} MATIC. Please click the link below for more details.`,
					generatorId: buyerData._id,
					receiverId: sellerData._id,
					itemId: fragment._id,
					type: 'Fragments',
				})

			if (sellerData.notificationSetting?.nftBought)
				await generatorNotification({
					description: `You have Bought new grid NFT for ${price} MATIC. Please click the link below for more details.`,
					generatorId: buyerData._id,
					receiverId: buyerData._id,
					itemId: fragment._id,
					type: 'Fragments',
				})
			if (error) {
				logger.error('Inside BuyToken Event')
				logger.error('error', error)
			}
		} catch (err) {
			logger.error(err)
		}
	}
)

OneForge.events.RedeemNFT(
	{
		fromBlock: 'latest',
	},
	async (error, event) => {
		try {
			logger.info('Inside BurnToken Event')

			const { linkListId, user } = event.returnValues
			const coordinate = await Coordinate.find().sort({ position: -1 }).limit(1)
			let lastPosition = coordinate[0].position
			// eslint-disable-next-line eqeqeq
			const fragmentData = await factory.updateOne(
				Fragment,
				{ tokenID: linkListId },
				{ isDisposed: true }
			)
			fragmentData.mergeCoordinate.forEach(async (ele) => {
				const coordObject = {
					x: ele.x,
					y: ele.y,
					z: ele.z,
					position: ++lastPosition,
				}
				// eslint-disable-next-line no-await-in-loop
				await factory.createOne(Coordinate, coordObject)
			})

			const userInfo = await factory.updateOne(
				User,
				{ walletAddress: user },
				{ $inc: { totalMerge: -1, totalFragment: -1, achievementTarget: -1 } }
			)

			const activityObject = {
				buyer: fragmentData.currentOwner,
				seller: fragmentData.currentOwner,
				createdBy: fragmentData.currentOwner,
				price: fragmentData.price,
				fragmentId: fragmentData._id,
				event: 'list',
			}

			// eslint-disable-next-line no-await-in-loop
			await factory.createOne(Activity, activityObject)
			await generatorNotification({
				description: `You have Redeemed a grid NFT "${fragmentData.name}".`,
				generatorId: userInfo._id,
				receiverId: userInfo._id,
				itemId: fragmentData._id,
				type: 'Fragments',
			})
			if (error) {
				logger.error('Inside BurnToken Event')
				logger.error('error', error)
			}
		} catch (err) {
			logger.error(err)
		}
	}
)

// Merge event for single NFT
OneForge.events.MergedNFTCreated(
	{
		fromBlock: 'latest',
	},
	async (error, event) => {
		try {
			logger.info('Inside MergedNFTCreated Event')
			const coordsArray = []
			let coordObject
			const { linkedListId, user, transactionHash } = event.returnValues
			let tokenData = await OneForge.methods.getData(linkedListId, 0).call({ from: user })
			// eslint-disable-next-line eqeqeq
			while (tokenData[1] != 0) {
				// eslint-disable-next-line no-await-in-loop
				const coordsData = await factory.getOne(Fragment, { tokenID: tokenData[1] })

				coordObject = {
					x: Number(coordsData.xCoordinate),
					y: Number(coordsData.yCoordinate),
					z: Number(coordsData.zCoordinate),
				}
				coordsArray.push(coordObject)
				// eslint-disable-next-line no-await-in-loop
				await factory.updateOne(
					Fragment,
					{ _id: coordsData._id },
					{ isMerged: true, isDisposed: true }
				)
				// eslint-disable-next-line no-await-in-loop
				tokenData = await OneForge.methods
					.getData(linkedListId, tokenData[1])
					.call({ from: user })
			}
			const userData = await factory.updateOne(
				User,
				{ walletAddress: user },
				{ $inc: { totalMerge: 1, achievementTarget: 1 } }
			)
			const fragmentObject = {
				name: linkedListId, // After merge linklist Id is new tokenId
				tokenID: linkedListId,
				transactionHash,
				ownerWalletAddress: user,

				xCoordinate: coordsArray[0].x,
				yCoordinate: coordsArray[0].y,
				zCoordinate: coordsArray[0].z,
				mergeCoordinate: coordsArray,
				currentOwner: userData._id,
				createdBy: userData._id,
			}
			const createFragment = await factory.createOne(Fragment, fragmentObject)

			const landingData = await factory.getOne(Landing, {}, 'largestFragment')
			if (!landingData?.largestFragment) {
				await factory.updateOne(
					Landing,
					{ _id: landingData._id },
					{ largestFragment: createFragment._id }
				)
			} else if (landingData?.largestFragment?.mergeCoordinate.length < coordsArray.length) {
				await factory.updateOne(
					Landing,
					{ _id: landingData._id },
					{ largestFragment: createFragment._id }
				)
			}
			const activityObject = {
				buyer: userData._id,
				seller: userData._id,
				createdBy: userData._id,
				fragmentId: createFragment._id,
				event: 'merge',
			}

			await factory.createOne(Activity, activityObject)

			await generatorNotification({
				description: `You have merged ${coordsArray.length} NFTs. Click the link below for more details.`,
				generatorId: userData._id,
				receiverId: userData._id,
				itemId: createFragment._id,
				type: 'Fragments',
			})

			if (error) {
				logger.error('Inside MergedNFTCreated Event')
				logger.error('error', error)
			}
		} catch (err) {
			logger.error(err)
		}
	}
)

// Merge event for single NFT with Merged NFT's
OneForge.events.MergedNFTUpdated(
	{
		fromBlock: 'latest',
	},
	async (error, event) => {
		try {
			logger.info('Inside MergedNFTUpdated Event')
			const coordsArray = []
			const { linkedListId, user } = event.returnValues
			let tokenData = await OneForge.methods.getData(linkedListId, 0).call({ from: user })
			const userData = await factory.updateOne(
				User,
				{ walletAddress: user },
				{ $inc: { totalMerge: 1, achievementTarget: 1 } }
			)
			// eslint-disable-next-line eqeqeq
			while (tokenData[1] != 0) {
				// eslint-disable-next-line no-await-in-loop
				const coordinateData = await NFTInstance.methods.decodeTokenId(tokenData[1]).call()
				const coordObject = {
					x: Number(coordinateData.x),
					y: Number(coordinateData.y),
					z: Number(coordinateData.z),
				}
				coordsArray.push(coordObject)
				// eslint-disable-next-line no-await-in-loop
				await factory.updateOne(
					Fragment,
					{ tokenID: tokenData[1] },
					{ isMerged: true, isDisposed: true }
				)
				// eslint-disable-next-line no-await-in-loop
				tokenData = await OneForge.methods
					.getData(linkedListId, tokenData[1])
					.call({ from: user })
			}
			const updatedFragment = await factory.updateOne(
				Fragment,
				{ tokenID: linkedListId },
				{ mergeCoordinate: coordsArray }
			)
			const landingData = await factory.getOne(Landing, {}, 'largestFragment')
			if (landingData?.largestFragment?.mergeCoordinate.length < coordsArray.length) {
				await factory.updateOne(
					Landing,
					{ _id: landingData._id },
					{ largestFragment: updatedFragment._id }
				)
			}

			const activityObject = {
				buyer: userData._id,
				seller: userData._id,
				createdBy: userData._id,
				fragmentId: updatedFragment._id,
				event: 'merge',
			}

			await factory.createOne(Activity, activityObject)

			await generatorNotification({
				description: `You have merged ${coordsArray.length} NFTs. Click the link below for more details.`,
				generatorId: userData._id,
				receiverId: userData._id,
				itemId: updatedFragment._id,
				type: 'Fragments',
			})

			if (error) {
				logger.error('Inside MergedNFTUpdated Event')
				logger.error('error', error)
			}
		} catch (err) {
			logger.error(err)
		}
	}
)

OneForge.events.MergedNFTCombined(
	{
		fromBlock: 'latest',
	},
	async (error, event) => {
		try {
			logger.info('Inside MergedNFTCombined Event')
			const coordsArray = []
			const { linkedListId, prevLinkedListId, user } = event.returnValues
			let tokenData = await OneForge.methods.getData(linkedListId, 0).call({ from: user })
			const userData = await factory.updateOne(
				User,
				{ walletAddress: user },
				{ $inc: { totalMerge: 1, achievementTarget: 1 } }
			)
			// eslint-disable-next-line eqeqeq
			while (tokenData[1] != 0) {
				// eslint-disable-next-line no-await-in-loop
				const coordinateData = await NFTInstance.methods.decodeTokenId(tokenData[1]).call()
				const coordObject = {
					x: Number(coordinateData.x),
					y: Number(coordinateData.y),
					z: Number(coordinateData.z),
				}
				coordsArray.push(coordObject)
				// eslint-disable-next-line no-await-in-loop
				tokenData = await OneForge.methods
					.getData(linkedListId, tokenData[1])
					.call({ from: user })
			}
			const updatedFragment = await factory.updateOne(
				Fragment,
				{ tokenID: linkedListId },
				{ mergeCoordinate: coordsArray }
			)
			await factory.updateOne(
				Fragment,
				{ tokenID: prevLinkedListId },
				{ isMerged: true, isDisposed: true }
			)
			const landingData = await factory.getOne(Landing, {}, 'largestFragment')
			if (landingData?.largestFragment?.mergeCoordinate.length < coordsArray.length) {
				await factory.updateOne(
					Landing,
					{ _id: landingData._id },
					{ largestFragment: updatedFragment._id }
				)
			}

			const activityObject = {
				buyer: userData._id,
				seller: userData._id,
				createdBy: userData._id,
				fragmentId: updatedFragment._id,
				event: 'merge',
			}

			await factory.createOne(Activity, activityObject)

			await generatorNotification({
				description: `You have merged ${coordsArray.length} NFTs. Click the link below for more details.`,
				generatorId: userData._id,
				receiverId: userData._id,
				itemId: updatedFragment._id,
				type: 'Fragments',
			})

			if (error) {
				logger.error('Inside MergedNFTCombined Event')
				logger.error('error', error)
			}
		} catch (err) {
			logger.error(err)
		}
	}
)

export default mintNFt
