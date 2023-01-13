import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import aws from 'aws-sdk'
import path from 'path'
import { fileURLToPath } from 'url'
import Web3 from 'web3'
import Trans from '@ethereumjs/tx'
import fs from 'fs'
import Web3WsProvider from 'web3-providers-ws'
import User from './userModel.js'
import Landing from './landingModel.js'
import Activity from '../history/activityModel.js'
import logger from '../../config/logger.js'
import catchAsync from '../../helpers/catchAsync.js'
import { AppError, handleResponse } from '../../helpers/responseHandler.js'
import config from '../../config/config.js'
import factory from '../commonServices.js'
import Achievement from './acheivementModel.js'
import { newAddCoordinates } from '../../helpers/generateCoordinate.js'
import Blockchain from '../fragment/blockchainModel.js'
import Fragments from '../fragment/fragmentModel.js'
import SellFragsments from '../fragment/sellFragmentModel.js'
import { generatorNotification } from '../notification/notificationService.js'
import commonObject from '../../helpers/commonObject.js'
import SoughtReq from './soughtReqModel.js'
import fetchGas from '../../helpers/fetchGas.js'
import {
	addContactToList,
	getListID,
	getContactByEmail,
	deleteContactFromList,
	sendNewsletterToList,
} from '../../helpers/sendGridServices.js'
import {
	getCurrentDateTime,
	getSubtractMonthsInDate,
	daysBetweenToDates,
	addDaysInDate,
} from '../../helpers/date.js'
import TradingHistory from '../history/tradingHistoryModel.js'

const { Transaction } = Trans

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const mintNFT = JSON.parse(
	// eslint-disable-next-line security/detect-non-literal-fs-filename
	fs.readFileSync(`${__dirname}/../../../artifacts/contracts/MintNFT.sol/MintNFT.json`)
)
const oneGameToken = JSON.parse(
	// eslint-disable-next-line security/detect-non-literal-fs-filename
	fs.readFileSync(`${__dirname}/../../../artifacts/contracts/OneGameToken.sol/OneGameToken.json`)
)

const web3Object = new Web3(new Web3WsProvider(config.polygonURL))
const NFTInstance = new web3Object.eth.Contract(mintNFT.abi, config.contractAddress.onecoinNFTMint)
const OGTInstance = new web3Object.eth.Contract(oneGameToken.abi, config.contractAddress.oneCoinOGT)
// import mint from '../websockets/eventTest.js'

const s3 = new aws.S3(config.s3Credentials)

const signToken = (id, walletAddress) => {
	return jwt.sign({ id, walletAddress }, config.jwtSecret)
}

const createSendToken = async (user, statusCode, req, res) => {
	const token = signToken(user._id, user.walletAddress)
	await user.save()
	user.password = undefined
	return handleResponse({ res, data: { token, user } })
}

const signup = catchAsync(async (req, res) => {
	const newUser = await User.create({
		name: req.body.name,
		email: req.body.email,
		password: req.body.password,
	})

	createSendToken(newUser, 201, req, res)
})

const login = catchAsync(async (req, res, next) => {
	const { walletAddress } = req.body

	if (!walletAddress) {
		return next(new AppError('Please provide walletAddress!', 400))
	}

	let user = await factory.getOne(User, { walletAddress })

	if (!user) {
		user = await factory.createOne(User, { walletAddress, name: walletAddress })
	}
	createSendToken(user, 200, req, res)
})

const logout = (req, res) => {
	res.cookie('jwt', 'loggedout', {
		expires: new Date(Date.now() + 10 * 1000),
		httpOnly: true,
	})
	res.status(200).json({ status: 'success' })
}

const restrictTo = (...roles) => {
	return (req, res, next) => {
		// roles ['admin', 'lead-guide']. role='user'
		if (!roles.includes(req.user.role)) {
			return next(new AppError('You do not have permission to perform this action', 403))
		}
		next()
	}
}

const forgotPassword = catchAsync(async (req, res, next) => {
	// 1) Get user based on POSTed email
	const user = await User.findOne({ email: req.body.email })
	if (!user) {
		return next(new AppError('There is no user with email address.', 404))
	}

	// 2) Generate the random reset token
	const resetToken = Math.random() * 6
	user.passwordResetToken = resetToken
	await user.save({ validateBeforeSave: false })

	// 3) Send it to user's email
	try {
		// const resetURL = `${req.protocol}://${req.get(
		// 	'host'
		// )}/api/v1/users/resetPassword/${resetToken}`;
		// await new Email(user, resetURL).sendPasswordReset();
		return handleResponse({ res, msg: 'Token sent to email!' })
	} catch (err) {
		user.passwordResetToken = undefined
		user.passwordResetExpires = undefined
		await user.save({ validateBeforeSave: false })

		return next(new AppError('There was an error sending the email. Try again later!'), 500)
	}
})

const resetPassword = catchAsync(async (req, res, next) => {
	// 1) Get user based on the token
	const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex')

	const user = await User.findOne({
		passwordResetToken: hashedToken,
		passwordResetExpires: { $gt: Date.now() },
	})

	// 2) If token has not expired, and there is user, set the new password
	if (!user) {
		return next(new AppError('Token is invalid or has expired', 400))
	}
	user.password = req.body.password
	user.passwordConfirm = req.body.passwordConfirm
	user.passwordResetToken = undefined
	user.passwordResetExpires = undefined
	await user.save()

	// 3) Update changedPasswordAt property for the user
	// 4) Log the user in, send JWT
	createSendToken(user, 200, req, res)
})

const updatePassword = catchAsync(async (req, res, next) => {
	// 1) Get user from collection
	const user = await User.findById(req.user.id).select('+password')

	// 2) Check if POSTed current password is correct
	if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
		return next(new AppError('Your current password is wrong.', 401))
	}

	// 3) If so, update password
	user.password = req.body.password
	await user.save()

	// 4) Log user in, send JWT
	createSendToken(user, 200, req, res)
})

// Filtered out unwanted fields names that are not allowed to be updated
const filterObj = (obj, ...allowedFields) => {
	const newObj = {}
	const string = JSON.stringify(obj)
	const objectValue = JSON.parse(string)
	Object.keys(obj).forEach((el) => {
		// eslint-disable-next-line security/detect-object-injection
		if (el && objectValue[el] !== '' && allowedFields.includes(el)) newObj[el] = obj[el]
	})
	return newObj
}

const getMe = (req, res, next) => {
	req.params.id = req.user?._id
	next()
}

// eslint-disable-next-line no-unused-vars
const updateMe = catchAsync(async (req, res, next) => {
	const filteredBody = filterObj(req.body, 'name', 'mobileNumber', 'countryCode', 'bio', 'email')
	// if (req.file) filteredBody.profilePic = req.file.filename

	// 3) Update user document
	const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
		new: true,
		runValidators: true,
	})

	if (updatedUser.notificationSetting?.updateProfile)
		await generatorNotification({
			description: `You have updated your profile.`,
			generatorId: updatedUser._id,
			receiverId: updatedUser._id,
			itemId: updatedUser._id,
			type: 'User',
		})
	return handleResponse({ res, data: updatedUser })
})

const getTop3Fragment = async (userId) => {
	const top3 = await Fragments.aggregate([
		{
			$match: {
				currentOwner: userId,
				isDisposed: false,
				isMerged: false,
			},
		},
		{
			$project: { merge_count: { $size: { $ifNull: ['$mergeCoordinate', []] } }, name: 1 },
		},
		{
			$sort: { merge_count: -1 },
		},
		{
			$limit: 3,
		},
	])
	return top3
}

const getUser = catchAsync(async (req, res, next) => {
	const { id } = req.params
	let user = await factory.getOne(User, { _id: id })
	const top3Fragment = await getTop3Fragment(user._id)
	if (!user) {
		return next(new AppError('User not found.', 404))
	}
	user = { ...user._doc, top3Fragment }
	handleResponse({ res, data: user })
})

// eslint-disable-next-line no-unused-vars
const getAllUsers = catchAsync(async (req, res, next) => {
	const user = await factory.getAll(User, req.query)
	handleResponse({ res, data: user })
})
// Do NOT update passwords with this!
const updateUser = catchAsync(async (req, res, next) => {
	const user = await factory.updateOne(User, { _id: req.params.id }, req.body)
	if (!user) {
		return next(new AppError('No document found with that ID', 404))
	}
	handleResponse({ res, data: user })
})

const deleteUser = catchAsync(async (req, res, next) => {
	const user = await factory.deleteOne(User, { _id: req.params.id })
	if (!user) {
		return next(new AppError('No document found with that ID', 404))
	}
	handleResponse({ res, data: user })
})

// eslint-disable-next-line no-unused-vars
const leaderBoardData = catchAsync(async (req, res, next) => {
	logger.info('Inside leaderBoardData Controller')

	let payoutData
	let noOfAddressRegistered = await User.countDocuments({ role: 'user' })
	if (!noOfAddressRegistered) {
		noOfAddressRegistered = 0
	}
	// let noOfPlayers = await User.countDocuments({ role: 'user', isPlayer: true })
	// if (!noOfPlayers) {
	// 	noOfPlayers = 0
	// }
	const landingData = await factory.getOne(Landing, {}, 'largestFragment')
	if (!landingData) {
		return next(new AppError('Landing data data not found', 404))
	}
	const {
		spotRemaining,
		totalFragment,
		availableFragment,
		largestFragment,
		noOfMerging,
		// platformSplit,
		payout,
	} = landingData

	const totalFragmentCount = await Fragments.countDocuments({ isDisposed: false })

	let mergeProgress = await Fragments.aggregate([
		{
			$match: {
				isDisposed: false,
			},
		},
		{
			$addFields: {
				mergeCount: {
					$cond: [{ $isArray: '$mergeCoordinate' }, { $size: '$mergeCoordinate' }, 0],
				},
			},
		},
		{
			$group: {
				_id: null,
				sumData: {
					$sum: { $cond: [{ $gte: ['$mergeCount', 2] }, '$mergeCount', 0] },
				},
			},
		},
	])

	mergeProgress = (mergeProgress[0].sumData / 125000) * 100 || 0.01

	// const mergeProgress = 5
	const availableFragmentData = Number(availableFragment) - Number(totalFragment)

	const totalDEXVolume = await TradingHistory.countDocuments({ event: 'sale' })

	const totalVolumeFragment = totalFragmentCount * Number(config.ogtValue)

	const liveDate = getSubtractMonthsInDate(1) // need to change as per client go live

	const pastDays = daysBetweenToDates(liveDate, getCurrentDateTime())
	const fullPogressDateEstimate = (Math.floor(pastDays) / mergeProgress) * (100 - mergeProgress)
	const estimateComplitingDate = addDaysInDate(fullPogressDateEstimate)

	if (req?.user) {
		payoutData = req.user.totalRoyalties
	} else {
		payoutData = payout
	}

	const totalVolumeLocked = await OGTInstance.methods
		.balanceOf(config.contractAddress.onecoinNFTMint)
		.call()
	const percentageVolumeLock = (Number(totalVolumeLocked) / 10 ** 18) * 100

	const top25biggestfragmentholders = await Fragments.aggregate([
		// { $unwind: '$mergeCoordinate' },
		{
			$lookup: {
				from: 'users',
				localField: 'currentOwner',
				foreignField: '_id',
				as: 'currentOwner',
			},
		},
		{ $unwind: '$currentOwner' },
		{
			$project: {
				merge_count: { $size: { $ifNull: ['$mergeCoordinate', []] } },
				name: 1,
				currentOwner: 1,
			},
		},
		{
			$sort: { merge_count: -1 },
		},
		{ $limit: 25 },
	])

	const top25RankHolder = await User.aggregate([
		{
			$lookup: {
				from: 'achievements',
				localField: 'achievement',
				foreignField: '_id',
				as: 'achievements',
			},
		},
		{ $unwind: '$achievements' },
		{ $sort: { 'achievements.minimumMerge': -1 } },
		{ $limit: 25 },
	])

	const top25soughtAfterPosition = await SoughtReq.aggregate([
		{
			$group: {
				_id: {
					X: '$x',
					Y: '$y',
					Z: '$z',
				},
				// answers: { $push: '$mergeCoordinate' },
				count: { $sum: 1 },
				// create: { $first: '$currentOwner' },
			},
		},
		{ $sort: { count: -1 } },
	])

	handleResponse({
		res,
		data: {
			noOfAddressRegistered,
			spotRemaining,
			payout: payoutData.toFixed(5),
			gameStatistics: {
				noOfPlayers: noOfAddressRegistered,
				totalFragment: totalFragmentCount,
				availableFragment: availableFragmentData,
				totalVolumeLocked,
				percentageVolumeLock,
				totalDEXVolume,
				// mergeProgress,
				estimateComplitingDate,
				largestFragment,
				noOfMerging,
				totalVolumeFragment,
			},
			leaderBoard: {
				top25soughtAfterPosition,
				top25biggestfragmentholders,
				top25RankHolder,
			},
		},
	})
})

// eslint-disable-next-line no-unused-vars
const getSuggestion = catchAsync(async (req, res, next) => {
	logger.info('Inside leaderBoardData Controller')
	const { _id } = req.user
	const onsale = await factory.getAll(
		SellFragsments,
		{ isSold: false, currentOwner: { $ne: _id } },
		'fragmentId'
	)

	const userNFT = await factory.getAll(Fragments, {
		currentOwner: _id,
		isDisposed: false,
	})
	let list = []
	userNFT.forEach(async (uel) => {
		const mergedData = [...uel.mergeCoordinate]
		onsale.forEach((mfel) => {
			const mel = mfel.fragmentId.mergeCoordinate

			mergedData.forEach((el) => {
				let count = false
				mel.forEach((coords) => {
					if (
						(coords.x - 1 === el.x || coords.x + 1 === el.x) &&
						coords.y === el.y &&
						coords.z === el.z
					) {
						count = true
					}

					if (
						coords.x === el.x &&
						(coords.y - 1 === el.y || coords.y + 1 === el.y) &&
						coords.z === el.z
					) {
						count = true
					}

					if (
						coords.x === el.x &&
						coords.y === el.y &&
						(coords.z - 1 === el.z || coords.z + 1 === el.z)
					) {
						count = true
					}
					if (count) {
						list.push(mfel)
					}
				})
			})
		})
	})

	list = [...new Set(list)]
	return handleResponse({
		res,
		data: {
			list,
		},
	})
})

const createSought = catchAsync(async (req, res, next) => {
	logger.info('Inside createSought Controller')
	const dataObj = filterObj(req.body, 'x', 'y', 'z')
	const { _id } = req.user
	const soughtReq = await factory.createOne(SoughtReq, { ...dataObj, createdBy: _id })
	if (!soughtReq) {
		return next(new AppError('Failed to soughtReq faq', 400))
	}
	handleResponse({ res, data: soughtReq })
})

// eslint-disable-next-line no-unused-vars
const possibleMerge = catchAsync(async (req, res, next) => {
	logger.info('Inside possibleMerge Controller')
	const { _id } = req.user
	// const onsale = await factory.getAll(SellFragsments, { isSold: false }, 'fragmentId')

	const userNFT = await factory.getAll(Fragments, {
		currentOwner: _id,
		isDisposed: false,
		isAtMarketPlace: false,
	})
	const tempUserList = [...userNFT]
	let list = []
	let tempList = []
	let mergeRow = []
	// console.log(userNFT)
	for (let i = 0; i < userNFT.length; i++) {
		// eslint-disable-next-line security/detect-object-injection
		const uel = userNFT[i]
		const mergedData = [...uel.mergeCoordinate]

		do {
			tempList = []
			// eslint-disable-next-line no-loop-func

			// eslint-disable-next-line no-loop-func
			for (let j = 0; j < tempUserList.length; j++) {
				// eslint-disable-next-line security/detect-object-injection
				const mel = tempUserList[j]
				const coords = mel.mergeCoordinate
				if (mel._id !== uel._id) {
					// eslint-disable-next-line no-loop-func
					mergedData.forEach((el) => {
						coords.forEach((cel) => {
							let count = false

							if (
								(cel.x - 1 === el.x || cel.x + 1 === el.x) &&
								cel.y === el.y &&
								cel.z === el.z
							) {
								count = true
							}

							if (
								cel.x === el.x &&
								(cel.y - 1 === el.y || cel.y + 1 === el.y) &&
								cel.z === el.z
							) {
								count = true
							}

							if (
								cel.x === el.x &&
								cel.y === el.y &&
								(cel.z - 1 === el.z || cel.z + 1 === el.z)
							) {
								count = true
							}
							if (count) {
								list.push(mel) // [{12,22,34}]
								list.push(uel)
								tempList.push(mel) // [{12,22,34}]
								tempUserList.splice(j, 1)
								j--
								// userNFT.splice(i, 1)
							}
						})
					})
				}
			}
		} while (tempList.length)
		list = [...new Set(list)]

		if (!list.length) {
			// eslint-disable-next-line no-continue
			continue
		}
		list = list.sort()

		// eslint-disable-next-line no-loop-func
		const isAlreadyinMergeRow = mergeRow.some((subarr) =>
			// eslint-disable-next-line security/detect-object-injection
			subarr.every((arrElem, ind) => arrElem._id === list[ind]._id)
		)

		if (!isAlreadyinMergeRow) {
			mergeRow.push(list)
		}

		list = []
	}

	mergeRow = [...new Set(mergeRow)]
	return handleResponse({
		res,
		data: {
			mergeRow,
		},
	})
})

// eslint-disable-next-line no-unused-vars
const getAcheivement = catchAsync(async (req, res, next) => {
	const { query } = req
	const acheivement = await factory.getAllWithPagination(Achievement, query)
	handleResponse({ res, data: acheivement })
})

const claimAcheivement = catchAsync(async (req, res, next) => {
	const { acheivementId } = req.body
	const { _id, achievementTarget } = req.user
	// if (typeof req.user?.achievement === 'object') {
	// 	return next(new AppError(`You've already claimed a acheivement`, 404))
	// }

	const acheivement = await factory.getOne(Achievement, { _id: acheivementId })
	if (!acheivement) {
		return next(new AppError('Acheivement not found with that ID', 404))
	}
	if (acheivement.minimumMerge > achievementTarget) {
		return next(
			new AppError(
				`${acheivement.minimumMerge} is the minimum merge to claim this acheivement`,
				400
			)
		)
	}
	const user = await factory.updateOne(
		User,
		{ _id },
		{
			achievement: acheivementId,
			achievementTarget: 0,
			achievementClaimDate: getCurrentDateTime(),
		}
	)

	await generatorNotification({
		description: `You have achieved rank ${acheivement.name}. Click the link below for more details.`,
		generatorId: user._id,
		receiverId: user._id,
		itemId: user._id,
		type: 'Achievement',
	})
	handleResponse({ res, data: user })
})

// eslint-disable-next-line no-unused-vars
const getAllActivity = catchAsync(async (req, res, next) => {
	logger.info('Inside getAllActivity Controller')
	const { query } = req
	const activityData = await factory.getAllWithPaginationAndPopulation(Activity, query, [
		'buyer',
		'seller',
		'fragmentId',
		'createdBy',
	])
	handleResponse({ res, data: activityData })
})

// eslint-disable-next-line no-unused-vars
const getUserActivity = catchAsync(async (req, res, next) => {
	logger.info('Inside getUserActivity Controller')
	const { limit, page } = req.query
	const queryData = {
		limit,
		page,
		createdBy: req.user._id,
	}
	const activityData = await factory.getAllWithPaginationAndPopulation(Activity, queryData, [
		'buyer',
		'seller',
		'fragmentId',
		'createdBy',
	])
	handleResponse({ res, data: activityData })
})

const updatePrivacySettingApi = catchAsync(async (req, res) => {
	logger.info('Inside updatePrivacySettingApi Controller')
	const { _id } = req.user
	const { showCollection, nftSold, nftBought, updateProfile, priceChange, mute } = req.body
	const dataObj = {
		privacySetting: {
			showCollection,
		},
		notificationSetting: {
			nftSold,
			nftBought,
			updateProfile,
			priceChange,
			mute,
		},
	}
	const result = await factory.updateOne(User, { _id }, dataObj)

	return handleResponse({
		res,
		msg: 'privacy setting updated',
		data: result,
	})
})

const updateProfilePic = catchAsync(async (req, res, next) => {
	logger.info('Inside updateProfilePic Controller')
	if (req.file === null || req.file === undefined) {
		return next(new AppError('Image is required', 403))
	}
	if (!req.user) {
		return next(new AppError('User not found.', 404))
	}
	const userData = await factory.getOne(User, { _id: req.user._id })
	if (userData.profilePic) {
		const params = {
			Bucket: 'onecoin-bucket-dev',
			Key: userData.profilePic.key,
		}
		s3.deleteObject(params, (err) => {
			if (err) {
				return next(new AppError(err.message, 500))
			}
		})
	}
	const imageObject = {
		name: req.file.originalname,
		link: req.file.location,
		key: req.file.key,
	}
	userData.profilePic = imageObject
	const updatedData = await factory.updateOne(
		User,
		{ _id: userData._id },
		{ profilePic: imageObject }
	)
	return handleResponse({
		res,
		msg: 'Profile pic updated successfully',
		data: updatedData,
	})
})

const updateCoverPic = catchAsync(async (req, res, next) => {
	logger.info('Inside updateCoverPic Controller')
	if (req.file === null || req.file === undefined) {
		return next(new AppError('Image is required', 403))
	}
	if (!req.user) {
		return next(new AppError('User not found.', 404))
	}
	const userData = await factory.getOne(User, { _id: req.user._id })
	if (userData.profilePic) {
		const params = {
			Bucket: 'onecoin-bucket-dev',
			Key: userData.profilePic.key,
		}
		s3.deleteObject(params, (err) => {
			if (err) {
				return next(new AppError(err.message, 500))
			}
		})
	}
	const imageObject = {
		name: req.file.originalname,
		link: req.file.location,
		key: req.file.key,
	}
	userData.profilePic = imageObject
	const updatedData = await factory.updateOne(
		User,
		{ _id: userData._id },
		{ coverPic: imageObject }
	)
	return handleResponse({
		res,
		msg: 'Cover pic updated successfully',
		data: updatedData,
	})
})

const generateCoordinate = catchAsync(async (req, res, next) => {
	logger.info('Inside generateCoordinate Controller')
	const { walletAddress } = req.user

	const MintData = await Blockchain.findOne()
	if (!MintData) {
		return next(new AppError('Blockchain data not found.', 404))
	}
	let lastPosition = MintData.lastMintedFragment
	const { noOfCoordinate } = req.params
	const coordinateArray = []
	let returnCoordinate
	const uniqueArray = []
	uniqueArray.push(lastPosition)
	for (let i = 0; i < noOfCoordinate; i++) {
		if (!uniqueArray.includes(lastPosition)) {
			i--
			// eslint-disable-next-line no-continue
			continue
		}
		// eslint-disable-next-line no-await-in-loop
		returnCoordinate = await newAddCoordinates(lastPosition)

		const coordinate = {
			x: returnCoordinate.x,
			y: returnCoordinate.y,
			z: returnCoordinate.z,
		}
		if (coordinateArray.includes(coordinate)) {
			i--
			// eslint-disable-next-line no-continue
			continue
		}
		lastPosition = returnCoordinate.position
		coordinateArray.push(coordinate)
		uniqueArray.push(lastPosition)
	}
	const x = []
	const y = []
	const z = []
	coordinateArray.forEach((el) => {
		x.push(el.x)
		y.push(el.y)
		z.push(el.z)
	})

	// /////// minting ///////////////////////////

	const privateKey = config.ownerPrivateKey
	const privateKeyBuffer = Buffer.from(privateKey, 'hex')
	const nonce = await web3Object.eth.getTransactionCount(
		web3Object.eth.accounts.privateKeyToAccount(privateKey).address,
		'pending'
	)
	const fetchedGas = await fetchGas()
	const gasPrice = Math.round(fetchedGas.fast.maxFee * 10) / 10

	const gasLimit = await web3Object.eth.estimateGas({
		from: config.ownerMintAddress,
		nonce: web3Object.utils.toHex(nonce),
		to: config.contractAddress.onecoinNFTMint,
		data: NFTInstance.methods.mint(walletAddress, '', [...x], [...y], [...z]).encodeABI(),
	})

	const txParams = {
		nonce: web3Object.utils.toHex(nonce),
		gasPrice: web3Object.utils.toHex(web3Object.utils.toWei(gasPrice.toString(), 'gwei')),
		to: config.contractAddress.onecoinNFTMint,
		gasLimit: web3Object.utils.toHex(gasLimit.toString()),
		data: NFTInstance.methods.mint(walletAddress, '', [...x], [...y], [...z]).encodeABI(),
	}
	let tx = Transaction.fromTxData(txParams, { common: commonObject.PolygonMumbai })

	tx = tx.sign(privateKeyBuffer)
	const serializedTx = tx.serialize()

	const result = await web3Object.eth
		.sendSignedTransaction(`0x${serializedTx.toString('hex')}`)
		.once('receipt', () => {
			logger.info('Mint successfull')
		})
		.on('error', (data) => {
			logger.error(data)
		})

	return handleResponse({
		res,
		msg: 'mint successfully',
		data: result,
	})
})

// eslint-disable-next-line no-unused-vars
const subscribeNewsletter = catchAsync(async (req, res, next) => {
	const { email } = req.query
	const listID = await getListID('OneCoin_Newsletter')
	await addContactToList(email, listID)
	return handleResponse({ res, msg: 'Newsletter subscribed successfully' })
})

const unsubscribeNewsletter = catchAsync(async (req, res, next) => {
	const { email } = req.query
	const contact = await getContactByEmail(email)
	if (contact == null) {
		return next(new AppError('You have already unsubcribed this newsletter!', 400))
	}
	const listID = await getListID('OneCoin_Newsletter')
	await deleteContactFromList(listID, contact)
	return handleResponse({
		res,
		msg: 'You have been successfully unsubscribed. If this was a mistake, Please re-subscribe ',
	})
})

// eslint-disable-next-line no-unused-vars
const pusblishNews = catchAsync(async (req, res, next) => {
	const listID = await getListID('OneCoin_Newsletter')
	const htmlNewsletter = req.file.buffer.toString()
	const { headers, protocol, body } = req
	await sendNewsletterToList(headers, protocol, body, htmlNewsletter, listID)
	return handleResponse({ res, msg: 'Newsletter has been sent to all subscribers.' })
})

export {
	signup,
	login,
	logout,
	restrictTo,
	forgotPassword,
	resetPassword,
	updatePassword,
	getMe,
	updateMe,
	getUser,
	getAllUsers,
	updateUser,
	deleteUser,
	leaderBoardData,
	claimAcheivement,
	getAcheivement,
	getAllActivity,
	getUserActivity,
	updatePrivacySettingApi,
	updateProfilePic,
	updateCoverPic,
	generateCoordinate,
	getSuggestion,
	possibleMerge,
	createSought,
	subscribeNewsletter,
	unsubscribeNewsletter,
	pusblishNews,
}
