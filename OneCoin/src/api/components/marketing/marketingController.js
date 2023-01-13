import mongoose from 'mongoose'
import logger from '../../config/logger.js'
import factory from '../commonServices.js'
import userMarketing from './userMarketingModel.js'
import { AppError, handleResponse } from '../../helpers/responseHandler.js'

const login = async (req, res, next) => {
	logger.info('Inside login')
	const { walletAddress } = req.body
	if (!walletAddress) {
		return next(new AppError('Wallet address is required', 400))
	}
	try {
		const condition = {
			walletAddress,
		}
		const user = await userMarketing.findOne(condition)
		if (!user) {
			return next(new AppError('wallet address is not registered', 403))
		}
		return handleResponse({
			res,
			msg: 'User found',
			data: user,
		})
	} catch (err) {
		logger.info('Error: ', err)
		return next(new AppError(err, 500))
	}
}

const createUser = async (req, res, next) => {
	logger.info('Inside marketing creating a user')
	let referredByUser
	const referralEarned = {}
	let roundDetails = []
	let roundText = ''
	const walletNameArr = ['METAMASK', 'COINBASE', 'TRUST']
	const { walletAddress, walletName, chainId, referral } = req.body
	if (!walletAddress) {
		return next(new AppError('Wallet address is required', 400))
	}
	if (!walletName) {
		return next(new AppError('Wallet name is required', 400))
	}
	if (!chainId) {
		return next(new AppError('Chain id is required', 400))
	}
	if (!walletNameArr.includes(walletName)) {
		return next(new AppError('Wallet name is invalid', 400))
	}
	try {
		const condition = {
			walletAddress,
		}
		const user = await userMarketing.findOne(condition)
		if (user) {
			return next(new AppError('This wallet address already registered', 409))
		}

		const soldNfts = await factory.totalSoldNfts()
		const currentRound = await factory.getCurrentRound(soldNfts)
		if (referral) {
			referredByUser = await userMarketing.findOne({
				referralCode: referral,
			})
		}

		if (currentRound !== 0) {
			roundDetails = await factory.getRoundDetails(currentRound)
			const intialReward = roundDetails.nftReward[0]
			roundText = await factory.getRoundText(currentRound)
			referralEarned[String(roundText)] = {
				0: intialReward,
			}
		}
		const referralCode = await factory.getRandomString(20)
		const userObj = new userMarketing({
			walletAddress,
			referralCode,
			referredBy: referredByUser ? referredByUser._id : undefined,
			walletName: walletName || undefined,
			chainId: chainId || undefined,
			nftEarned: currentRound !== 0 ? referralEarned : undefined,
		})

		userObj.save(async (err) => {
			if (err) {
				return next(new AppError('Something went wrong!', 400))
			}
			if (referredByUser && currentRound !== 0) {
				await factory.updateReward(referredByUser._id, roundText, roundDetails)
			}
			return handleResponse({
				res,
				msg: 'User created successfully',
				data: {
					_id: userObj._id,
				},
			})
		})
	} catch (err) {
		logger.info('Error: ', err)
		return next(new AppError(err, 500))
	}
}

const getUserDetails = async (req, res, next) => {
	logger.info('getting user details')
	const { walletAddress } = req.query
	if (!walletAddress) {
		return next(new AppError('Wallet address is required', 400))
	}

	try {
		const condition = {
			walletAddress,
		}
		const user = await userMarketing.findOne(condition)
		if (!user) {
			return next(new AppError('User not found!', 404))
		}
		return handleResponse({
			res,
			msg: 'User found',
			data: user,
		})
	} catch (err) {
		logger.info('Error: ', err)
		return next(new AppError(err, 500))
	}
}

const getDashboard = async (req, res, next) => {
	logger.info('getting dashboard')
	const { walletAddress } = req.query
	if (!walletAddress) {
		return next(new AppError('Wallet address is required', 400))
	}

	try {
		const condition = {
			walletAddress,
		}
		const user = await userMarketing.findOne(condition)
		if (!user) {
			return next(new AppError('User not found!', 404))
		}

		// getting users count
		const usersCount = await userMarketing.countDocuments({ role: 'user' })

		// getting total user invites count
		const userInvitesCount = await userMarketing.countDocuments({
			referredBy: mongoose.Types.ObjectId(user._id),
		})

		// getting earned nft
		const userEarnedNft = await factory.getNftEarned(condition)

		return handleResponse({
			res,
			msg: 'Success',
			data: {
				usersCount,
				userInvitesCount,
				userEarnedNft,
			},
		})
	} catch (err) {
		logger.info('Error: ', err)
		return next(new AppError(err, 500))
	}
}

const getRoundDetails = async (req, res, next) => {
	logger.info('getting round details')

	try {
		// getting round details
		const roundProgress = await factory.getRoundsProgress()

		return handleResponse({
			res,
			msg: 'Success',
			data: roundProgress,
		})
	} catch (err) {
		logger.info('Error: ', err)
		return next(new AppError(err, 500))
	}
}

export {
	// eslint-disable-next-line import/prefer-default-export
	login,
	createUser,
	getUserDetails,
	getDashboard,
	getRoundDetails,
}
