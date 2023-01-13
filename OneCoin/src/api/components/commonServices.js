import mongoose from 'mongoose'
import APIFeatures from '../helpers/apiFeature.js'
import { getTotalPage, getSkipCount } from '../helpers/common.js'
import userMarketing from './marketing/userMarketingModel.js'
import roundReward from './reward/roundRewardModel.js'

const deleteOne = async (Model, filterObj) => {
	const doc = await Model.findOneAndDelete(filterObj)

	return doc
}

const updateOne = async (Model, filterObj, updateObj) => {
	const doc = await Model.findOneAndUpdate(filterObj, updateObj, {
		new: true,
		runValidators: true,
	})
	return doc
}

const createOne = async (Model, dataObj) => {
	const doc = await Model.create(dataObj)
	return doc
}

// popOption = populate fields
const getOne = async (Model, filterObj, popOptions, selectOptions) => {
	let query = Model.findOne(filterObj)
	if (selectOptions || selectOptions !== '') query = query.select(selectOptions)
	if (popOptions || popOptions !== '') query = query.populate(popOptions)
	const doc = await query
	return doc
}

const getAll = async (Model, filterObj = {}, popOptions) => {
	let query = Model.find()
	if (popOptions || popOptions !== '') query = query.populate(popOptions)
	const features = new APIFeatures(query, filterObj).filter().sort()
	const doc = await features.query

	return doc
}

const getAllWithPagination = async (Model, filterObj, popOptions) => {
	let query = Model.find()
	const docQuery = Model.find()
	if (popOptions) query = query.populate(popOptions)
	const features = new APIFeatures(query, filterObj).filter().sort().limitFields().paginate()

	const d = new APIFeatures(docQuery, filterObj).filter()

	const doc = await d.query
	const list = await features.query
	const totalItem = doc.length
	const limit = filterObj.limit || 10
	const currentPage = filterObj.page || 1
	const totalPage = getTotalPage(totalItem, limit)
	const skipCount = getSkipCount(limit, currentPage)

	return { list, totalItem, skipCount, totalPage }
}

const getAllWithPaginationAndPopulation = async (Model, filterObj, popArray) => {
	let query = Model.find()
	const docQuery = Model.find()
	// eslint-disable-next-line array-callback-return
	popArray.map((popOptions) => {
		if (popOptions) query = query.populate(popOptions)
	})
	const features = new APIFeatures(query, filterObj).filter().sort().limitFields().paginate()

	const d = new APIFeatures(docQuery, filterObj).filter()

	const doc = await d.query
	const list = await features.query
	const totalItem = doc.length
	const limit = filterObj.limit || 10
	const currentPage = filterObj.page || 1
	const totalPage = getTotalPage(totalItem, limit)
	const skipCount = getSkipCount(limit, currentPage)

	return { list, totalItem, skipCount, totalPage }
}

const calculateNftEarn = (nftEarnedObj) => {
	let totalNft = 0
	if (nftEarnedObj && Object.keys(nftEarnedObj).length !== 0) {
		const rewardsObj = Object.values(nftEarnedObj)

		for (let i = 0; i < rewardsObj.length; i++) {
			const rewardsPerRound = rewardsObj[String(i)]
			totalNft +=
				rewardsPerRound[
					Object.keys(rewardsPerRound)[Object.keys(rewardsPerRound).length - 1]
				]
		}
	}
	return totalNft
}

const getRandomString = async (length) => {
	const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz'

	let result = '1a'
	for (let i = 0; i < length; i++) {
		result += randomChars.charAt(Math.floor(Math.random() * randomChars.length))
	}
	const user = await userMarketing.findOne({ referralCode: result })
	if (user) {
		result = await getRandomString(length)
	}
	return result
}

const totalSoldNfts = async () => {
	let totalNfts = 0
	const earnedNftData = await userMarketing
		.find({ nftEarned: { $exists: true, $ne: null } })
		.lean()

	// eslint-disable-next-line no-restricted-syntax
	for (const element of earnedNftData) {
		if (element.nftEarned && Object.keys(element.nftEarned).length !== 0) {
			const nft = calculateNftEarn(element.nftEarned)
			totalNfts += nft
		}
	}
	return totalNfts
}

const getCurrentRound = async (soldNfts) => {
	let round = 0
	const getRoundReward = await roundReward.find()
	const maxNft = []
	getRoundReward.forEach((element) => {
		maxNft.push(parseFloat(element.maxNftReward.toString()))
	})
	const maxNftR1 = maxNft[0]
	const maxNftR2 = maxNftR1 + maxNft[1]
	const maxNftR3 = maxNftR2 + maxNft[2]
	const maxNftR4 = maxNftR3 + maxNft[3]
	const maxNftR5 = maxNftR4 + maxNft[4]
	const maxNftR6 = maxNftR5 + maxNft[5]
	const maxNftR7 = maxNftR6 + maxNft[6]
	const maxNftR8 = maxNftR7 + maxNft[7]
	const maxNftR9 = maxNftR8 + maxNft[8]
	const maxNftR10 = maxNftR9 + maxNft[9]

	if (soldNfts <= maxNftR1) {
		round = 1
	} else if (soldNfts <= maxNftR2) {
		round = 2
	} else if (soldNfts <= maxNftR3) {
		round = 3
	} else if (soldNfts <= maxNftR4) {
		round = 4
	} else if (soldNfts <= maxNftR5) {
		round = 5
	} else if (soldNfts <= maxNftR6) {
		round = 6
	} else if (soldNfts <= maxNftR7) {
		round = 7
	} else if (soldNfts <= maxNftR8) {
		round = 8
	} else if (soldNfts <= maxNftR9) {
		round = 9
	} else if (soldNfts <= maxNftR10) {
		round = 10
	} else {
		round = 0
	}

	return round
}

const getRoundDetails = async (currentRound) => {
	const nftReward = await roundReward.findOne({ round: currentRound })
	return nftReward
}

const getRoundText = async (currentRound) => {
	return `r${currentRound}`
}

const updateReward = async (userId, roundText, roundDetails) => {
	const userDetail = await userMarketing.findOne({
		_id: mongoose.Types.ObjectId(userId),
	})
	const userNftEarned = userDetail.nftEarned

	// check if round already exist in user reward
	if (userNftEarned && roundText in userNftEarned) {
		const newObj = userNftEarned[String(roundText)]
		const lastObjKey = Object.keys(newObj)[Object.keys(newObj).length - 1]
		const newKey = parseInt(lastObjKey, 10) + 1

		// only for first 10 referral
		if (newKey <= 10) {
			const newReward = roundDetails.nftReward[String(newKey)]

			newObj[String(newKey)] = newReward
			userNftEarned[roundText.toString()] = newObj
			userDetail.nftEarned = userNftEarned
			await userMarketing.updateOne(
				{ _id: mongoose.Types.ObjectId(userId) },
				{ $set: { nftEarned: userNftEarned } }
			)
		}
	} else {
		const reward = {}
		// for new round first reward
		const newObj = {
			1: roundDetails.nftReward[1],
		}
		reward[String(roundText)] = newObj

		const newNftEarned = { ...userNftEarned, ...reward }
		await userMarketing.updateOne(
			{ _id: mongoose.Types.ObjectId(userId) },
			{ $set: { nftEarned: newNftEarned } }
		)
	}
}

const getNftEarned = async (walletAddress) => {
	const EarnedNftData = await userMarketing.findOne(walletAddress, { nftEarned: 1 })
	const nftEarned = await calculateNftEarn(EarnedNftData.nftEarned)
	return nftEarned
}

const getRoundsProgress = async () => {
	let totalRoundNft = 0
	const roundsArray = []

	const soldNfts = await totalSoldNfts()
	const currentRound = await getCurrentRound(soldNfts)
	const currentRoundDetails = await getRoundDetails(currentRound)

	if (currentRound !== 0) {
		for (let i = 1; i <= currentRound; i++) {
			// eslint-disable-next-line no-await-in-loop
			const roundDetail = await getRoundDetails(i)
			totalRoundNft += parseFloat(roundDetail.maxNftReward.toString())
			if (i < currentRound) {
				roundsArray.push({
					round: i,
					percentage: 100,
				})
			} else {
				const maxNft = parseFloat(currentRoundDetails.maxNftReward.toString())
				const roundNft = totalRoundNft - maxNft
				const roundNftsold = soldNfts - roundNft
				const percentage = (roundNftsold / maxNft) * 100

				roundsArray.push({
					round: i,
					percentage: parseInt(percentage, 10),
				})
			}
		}
	} else {
		const getRoundReward = await roundReward.find()
		getRoundReward.forEach((element) => {
			roundsArray.push({
				round: element.round,
				percentage: 100,
			})
		})
	}
	return roundsArray
}

export default {
	getAll,
	getOne,
	createOne,
	updateOne,
	deleteOne,
	getAllWithPagination,
	getAllWithPaginationAndPopulation,
	getRandomString,
	updateReward,
	totalSoldNfts,
	getCurrentRound,
	getRoundText,
	getRoundDetails,
	getNftEarned,
	getRoundsProgress,
}
