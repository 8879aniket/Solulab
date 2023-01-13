import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import aws from 'aws-sdk'
import factory from '../commonServices.js'
import User from '../user/userModel.js'
import Landing from '../user/landingModel.js'
import catchAsync from '../../helpers/catchAsync.js'
import logger from '../../config/logger.js'
import config from '../../config/config.js'
import { AppError, handleResponse } from '../../helpers/responseHandler.js'
import Fragments from '../fragment/fragmentModel.js'
import SellFragments from '../fragment/sellFragmentModel.js'
import TradingHistory from '../history/tradingHistoryModel.js'
import FAQ from '../faq/faqModel.js'
import { filterObj } from '../../helpers/common.js'
import Blog from '../blogs/blogModel.js'
import sendSMS from '../../helpers/sms.js'
import SupportRequest from '../supportRequest/supportReqModel.js'
import Email from '../../helpers/email.js'
import { generatorNotification } from '../notification/notificationService.js'

const s3 = new aws.S3(config.s3Credentials)

const signToken = (id) => {
	return jwt.sign({ id }, config.jwtSecret)
}

const createSendToken = async (user, statusCode, req, res) => {
	const token = signToken(user._id)
	await user.save()
	user.password = undefined
	return handleResponse({ res, data: { token, user } })
}

const initiateLogin = catchAsync(async (req, res, next) => {
	logger.info('Inside admin initiateLogin controller')
	const { email, password } = req.body

	if (!email || !password) {
		return next(new AppError('Please provide email and password!', 400))
	}

	const user = await factory.getOne(User, { email })
	if (!user || !(await user.correctPassword(password, user.password))) {
		return next(new AppError('Incorrect email or password', 401))
	}

	if (user.role !== 'admin') {
		return next(new AppError('Only admin can login', 401))
	}
	const otp = Math.floor(100000 + Math.random() * 900000)
	const updateUser = await factory.updateOne(User, { email: user.email }, { otp })

	// TODO : Send otp to user mobile
	await sendSMS(updateUser)
	return handleResponse({
		res,
		msg: 'One time password sent',
		data: user,
	})
})

const login = catchAsync(async (req, res, next) => {
	logger.info('Inside admin login controller')
	const { email, otp } = req.body

	if (!otp) {
		return next(new AppError('Please provide one time password!', 400))
	}

	const user = await factory.getOne(User, { email })

	// eslint-disable-next-line eqeqeq
	// if (user.otp != otp) {
	// 	return next(new AppError('Incorrect one time password', 401))
	// }

	createSendToken(user, 200, req, res)
})

const updateMobileNumber = catchAsync(async (req, res, next) => {
	logger.info('Inside updateMobileNumber controller')
	const { mobileNumber, countryCode } = req.body
	const { email } = req.user

	const user = await factory.getOne(User, { mobileNumber })
	if (user) {
		return next(new AppError('User already exist with this number', 400))
	}

	const otp = Math.floor(100000 + Math.random() * 900000)
	const updateUser = await factory.updateOne(User, { email }, { otp })

	await sendSMS({ otp, countryCode, mobileNumber })

	return handleResponse({
		res,
		msg: 'OTP sent',
		data: updateUser,
	})
})

const verifyUpdateMobileOTP = catchAsync(async (req, res, next) => {
	logger.info('Inside verifyUpdateMobileOTPApi controller')

	const { countryCode, mobileNumber, otp } = req.body
	const { email } = req.user
	// eslint-disable-next-line eqeqeq
	if (otp != req.user.otp) {
		return next(new AppError('Incorrect one time password', 400))
	}

	const result = await factory.updateOne(User, { email }, { mobileNumber, countryCode })

	return handleResponse({
		res,
		msg: 'Mobile number updayed successfully',
		data: result,
	})
})

const verifyOtp = catchAsync(async (req, res, next) => {
	logger.info('Inside verify OTP controller')
	const { _id, otp } = req.body
	const user = await factory.getOne(User, { _id })

	if (!user) {
		return next(new AppError('User not found', 401))
	}

	if (user.otp !== Number(otp)) {
		return next(new AppError('Incorrect one time password', 401))
	}

	return handleResponse({
		res,
		msg: 'One time password verified',
		data: user,
	})
})

const forgotPassword = catchAsync(async (req, res, next) => {
	logger.info('Inside forgot password controller')
	const { email } = req.body
	const user = await factory.getOne(User, { email })
	if (!user) {
		return next(new AppError('There is no user with email address.', 404))
	}

	const otp = Math.floor(100000 + Math.random() * 900000)
	await factory.updateOne(User, { email: user.email }, { otp })

	// TODO: Send it to user's email
	try {
		// eslint-disable-next-line no-unused-expressions
		user && new Email({ to: user.email, name: user.name }).forgotPassword({ otp })

		return handleResponse({ res, msg: 'Token sent to email!', data: { userId: user._id } })
	} catch (err) {
		return next(new AppError('There was an error sending the email. Try again later!'), 500)
	}
})

const resetPassword = catchAsync(async (req, res, next) => {
	const { _id, password } = req.body
	const user = await factory.getOne(User, { _id })
	if (!user) {
		return next(new AppError('Session has expired', 400))
	}
	user.password = password
	user.otp = undefined
	await user.save()

	createSendToken(user, 200, req, res)
})

const getPlayer = catchAsync(async (req, res, next) => {
	logger.info('Inside getPlayer Controller')
	const user = await factory.getOne(User, { _id: req.params.id })
	if (!user) {
		return next(new AppError('User not found', 404))
	}
	handleResponse({ res, data: user })
})

// eslint-disable-next-line no-unused-vars
const getAllPlayers = catchAsync(async (req, res, next) => {
	logger.info('Inside getAllPlayer Controller')
	const user = await factory.getAllWithPagination(User, req.query)
	handleResponse({ res, data: user })
})

const updateAdminProfile = catchAsync(async (req, res, next) => {
	logger.info('Inside updateAdminProfile Controller')
	const { id, name, bio, profilePic } = req.body
	const user = await factory.updateOne(
		User,
		{ _id: id },
		{
			$set: {
				...(name && {
					name,
				}),
				...(bio && {
					bio,
				}),
				...(profilePic && {
					profilePic,
				}),
			},
		}
	)
	if (!user) {
		return next(new AppError('User not found', 404))
	}
	await generatorNotification({
		description: `You have updated your profile.`,
		generatorId: req.user._id,
		receiverId: req.user._id,
		itemId: req.user._id,
		type: 'User',
	})
	handleResponse({ res, data: user })
})

const userMuteStatus = catchAsync(async (req, res, next) => {
	logger.info('Inside muteUser Controller')
	const { mute, muteReason } = req.body
	let muteData = muteReason
	if (!muteReason) {
		muteData = ''
	}
	const user = await factory.updateOne(
		User,
		{ _id: req.body.id },
		{ isMute: mute, muteReason: muteData }
	)
	if (!user) {
		return next(new AppError('User not found', 404))
	}
	let fragmentList
	if (mute) {
		fragmentList = await factory.getAll(Fragments, {
			currentOwner: user._id,
			isAtMarketPlace: true,
		})
		if (fragmentList?.length > 0) {
			fragmentList.forEach(async (fragment) => {
				const findItem = await factory.updateOne(
					Fragments,
					{ _id: fragment._id },
					{ isAtMarketPlace: false }
				)
				await factory.deleteOne(SellFragments, { fragmentId: findItem._id })
			})
		}
	}
	if (mute) {
		if (user?.email) {
			new Email({ to: user.email, name: user.name }).text({
				subject: 'Mute Profile',
				text: `You're muted by admin due to ${muteData}. Please contact admin to unmute.`,
			})
		}
		if (user.notificationSetting?.mute)
			await generatorNotification({
				description: `You have been muted from the game for the reason "${muteData}".`,
				generatorId: req.user._id,
				receiverId: user._id,
				itemId: user._id,
				type: 'User',
			})
	} else if (user?.email) {
		new Email({ to: user.email, name: user.name }).text({
			subject: 'Unmute Profile',
			text: "Your request for unmuting is accepted.You're unmuted by admin now.",
		})

		if (user.notificationSetting?.mute)
			await generatorNotification({
				description: `You are unmuted from the game as you specified the valid reason.`,
				generatorId: req.user._id,
				receiverId: user._id,
				itemId: user._id,
				type: 'User',
			})
	}
	// eslint-disable-next-line no-unused-expressions
	mute
		? await generatorNotification({
				description: `You have muted ${user.name} from the Platform for the reason "${muteData}".`,
				generatorId: req.user._id,
				receiverId: req.user._id,
				itemId: user._id,
				type: 'User',
		  })
		: await generatorNotification({
				description: `You have unmuted ${user.name} from the Platform for the reason "${muteData}".`,
				generatorId: req.user._id,
				receiverId: req.user._id,
				itemId: user._id,
				type: 'User',
		  })
	handleResponse({ res, data: user })
})

const changePassword = catchAsync(async (req, res, next) => {
	logger.info('Inside ChangePassword Controller')
	const { id, oldPassword, newPassword } = req.body
	if (oldPassword === newPassword) {
		return next(new AppError('Old password and New password cannot be same', 401))
	}
	const user = await factory.getOne(User, { _id: id }, '', '+password')
	if (!user) {
		return next(new AppError('User not found', 404))
	}
	if (!(await user.correctPassword(oldPassword, user.password))) {
		return next(new AppError('Your current password is wrong.', 401))
	}
	const passwordData = await bcrypt.hash(newPassword, 12)
	const updatedData = await factory.updateOne(
		User,
		{ _id: id },
		{
			$set: {
				password: passwordData,
			},
		}
	)
	await generatorNotification({
		description: `You have changed your password.`,
		generatorId: user._id,
		receiverId: user._id,
		itemId: user._id,
		type: 'User',
	})
	handleResponse({ res, data: updatedData })
})

// eslint-disable-next-line no-unused-vars
const getAllFragments = catchAsync(async (req, res, next) => {
	logger.info('Inside getAllFragments Controller')
	const { query } = req
	query.isDisposed = false
	const fragments = await factory.getAllWithPagination(Fragments, query, 'currentOwner')
	handleResponse({ res, data: fragments })
})

const getFragment = catchAsync(async (req, res, next) => {
	logger.info('Inside fragment Controller')
	const { id } = req.params
	const fragment = await factory.getOne(Fragments, { _id: id }, 'currentOwner')
	if (!fragment) {
		return next(new AppError('fragments not found', 404))
	}
	const sellFragment = await factory.getOne(SellFragments, {
		fragmentId: fragment._id,
		isSold: false,
	})
	handleResponse({ res, data: { fragment, sellFragment } })
})

// eslint-disable-next-line no-unused-vars
const getAllTradingHistory = catchAsync(async (req, res, next) => {
	logger.info('Inside getAllTradingHistory Controller')
	const { query } = req
	const tradingHistory = await factory.getAllWithPagination(
		TradingHistory,
		query,
		'buyer,seller,fragmentId'
	)
	handleResponse({ res, data: tradingHistory })
})

const getTradingHistory = catchAsync(async (req, res, next) => {
	logger.info('Inside getTradingHistory Controller')
	const { id } = req.params
	const tradingHistory = await factory.getOne(
		TradingHistory,
		{ fragmentId: id },
		'buyer,seller,fragmentId'
	)
	if (!tradingHistory) {
		return next(new AppError('fragments not found', 404))
	}
	handleResponse({ res, data: tradingHistory })
})

const getDashboardData = catchAsync(async (req, res, next) => {
	logger.info('Inside getDashboardData Controller')
	let noOfPlayers = await User.countDocuments({ role: 'user' })
	if (!noOfPlayers) {
		noOfPlayers = 0
	}
	const landingData = await factory.getOne(Landing)
	if (!landingData) {
		return next(new AppError('Landing data data not found', 404))
	}
	const { totalFragment, largestFragment } = landingData
	handleResponse({
		res,
		data: {
			totalPlayers: noOfPlayers,
			totalMintedNFT: totalFragment,
			mostValuableNFT: largestFragment,
		},
	})
})

// eslint-disable-next-line no-unused-vars
const getAllFAQ = catchAsync(async (req, res, next) => {
	logger.info('Inside getAllFAQ Controller')
	const { query } = req
	const faq = await factory.getAllWithPagination(FAQ, query)
	handleResponse({ res, data: faq })
})

const getFAQ = catchAsync(async (req, res, next) => {
	logger.info('Inside fragment Controller')
	const { id } = req.params
	const faq = await factory.getOne(FAQ, { _id: id })
	if (!faq) {
		return next(new AppError('faq not found', 404))
	}

	handleResponse({ res, data: faq })
})

const deleteFAQ = catchAsync(async (req, res, next) => {
	logger.info('Inside fragment Controller')
	const { id } = req.params
	const faq = await factory.deleteOne(FAQ, { _id: id })
	if (!faq) {
		return next(new AppError('faq not found', 404))
	}

	handleResponse({ res, data: faq })
})

const createFAQ = catchAsync(async (req, res, next) => {
	logger.info('Inside fragment Controller')
	const dataObj = filterObj(req.body, 'question', 'answer')
	const { _id } = req.user
	const faq = await factory.createOne(FAQ, { ...dataObj, createdBy: _id })
	if (!faq) {
		return next(new AppError('Failed to create faq', 400))
	}
	handleResponse({ res, data: faq })
})

const updateFAQ = catchAsync(async (req, res, next) => {
	logger.info('Inside fragment Controller')
	const dataObj = filterObj(req.body, 'question', 'answer')
	const { id } = req.params
	const faq = await factory.updateOne(FAQ, { _id: id }, dataObj)
	if (!faq) {
		return next(new AppError('faq not found', 404))
	}

	handleResponse({ res, data: faq })
})

// eslint-disable-next-line no-unused-vars
const getAllBlog = catchAsync(async (req, res, next) => {
	logger.info('Inside getAllBlog Controller')
	const { query } = req
	const blog = await factory.getAllWithPagination(Blog, query)
	handleResponse({ res, data: blog })
})

const getBlog = catchAsync(async (req, res, next) => {
	logger.info('Inside getBlog Controller')
	const { id } = req.params
	const blog = await factory.getOne(Blog, { _id: id })
	if (!blog) {
		return next(new AppError('blog not found', 404))
	}

	handleResponse({ res, data: blog })
})

const deleteBlog = catchAsync(async (req, res, next) => {
	logger.info('Inside deleteBlog Controller')
	const { id } = req.params
	const blog = await factory.deleteOne(Blog, { _id: id })
	if (!blog) {
		return next(new AppError('Blog not found', 404))
	}

	handleResponse({ res, data: blog })
})

const createBlog = catchAsync(async (req, res, next) => {
	logger.info('Inside createBlog Controller')
	if (req.file === null || req.file === undefined) {
		return next(new AppError('Image is required', 403))
	}
	const dataObj = filterObj(req.body, 'title', 'description')
	const { _id } = req.user
	const imageObject = {
		name: req.file.originalname,
		link: req.file.location,
		key: req.file.key,
	}
	const blog = await factory.createOne(Blog, {
		...dataObj,
		createdBy: _id,
		blogImage: imageObject,
	})
	if (!blog) {
		return next(new AppError('Failed to create blog', 400))
	}
	handleResponse({ res, data: blog })
})

const updateBlogPic = catchAsync(async (req, res, next) => {
	logger.info('Inside updateBlogPic Controller')
	if (req.file === null || req.file === undefined) {
		return next(new AppError('Image is required', 403))
	}
	const { id } = req.params
	const blogData = await factory.getOne(Blog, { _id: id })
	if (!blogData) {
		return next(new AppError('Blog not found', 404))
	}
	if (blogData.blogImage) {
		const params = {
			Bucket: 'onecoin-bucket-dev',
			Key: blogData.blogImage.key,
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
	const updatedData = await factory.updateOne(
		Blog,
		{ _id: blogData._id },
		{ blogImage: imageObject }
	)
	return handleResponse({
		res,
		msg: 'Profile pic updated successfully',
		data: updatedData,
	})
})

const updateBlog = catchAsync(async (req, res, next) => {
	logger.info('Inside updateBlog Controller')
	const dataObj = filterObj(req.body, 'title', 'description')
	const { id } = req.params
	const blog = await factory.updateOne(Blog, { _id: id }, dataObj)
	if (!blog) {
		return next(new AppError('blog not found', 404))
	}

	handleResponse({ res, data: blog })
})

// eslint-disable-next-line no-unused-vars
const getAllSupportReq = catchAsync(async (req, res, next) => {
	logger.info('Inside getAllSupportReq Controller')
	const { query } = req
	const SR = await factory.getAllWithPaginationAndPopulation(SupportRequest, query, ['createdBy'])

	handleResponse({ res, data: SR })
})

const getSupportReq = catchAsync(async (req, res, next) => {
	logger.info('Inside getSupportReq Controller')
	const { id } = req.params
	const SR = await factory.getOne(SupportRequest, { _id: id }, 'createdBy')
	if (!SR) {
		return next(new AppError('support request not found', 404))
	}

	handleResponse({ res, data: SR })
})

const updateSupportReq = catchAsync(async (req, res, next) => {
	logger.info('Inside updateSupportReq Controller')
	const dataObj = filterObj(req.body, 'isResolved')
	const { id } = req.params
	const SR = await factory.updateOne(SupportRequest, { _id: id }, dataObj)
	if (!SR) {
		return next(new AppError('SupportRequest not found', 404))
	}

	handleResponse({ res, data: SR })
})

const updateAdminProfilePic = catchAsync(async (req, res, next) => {
	logger.info('Inside updateAdminProfilePic Controller')
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

export {
	initiateLogin,
	login,
	verifyOtp,
	forgotPassword,
	resetPassword,
	updateMobileNumber,
	verifyUpdateMobileOTP,
	getPlayer,
	getAllPlayers,
	userMuteStatus,
	updateAdminProfile,
	changePassword,
	getAllFragments,
	getFragment,
	getAllTradingHistory,
	getTradingHistory,
	getDashboardData,
	getAllFAQ,
	getFAQ,
	deleteFAQ,
	createFAQ,
	updateFAQ,
	getAllBlog,
	getBlog,
	deleteBlog,
	createBlog,
	updateBlog,
	getAllSupportReq,
	getSupportReq,
	updateSupportReq,
	updateAdminProfilePic,
	updateBlogPic,
}
