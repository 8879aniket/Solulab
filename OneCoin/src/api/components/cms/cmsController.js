import catchAsync from '../../helpers/catchAsync.js'
import logger from '../../config/logger.js'
import { AppError, handleResponse } from '../../helpers/responseHandler.js'
import factory from '../commonServices.js'
import CMS from './cmsModel.js'
import User from '../user/userModel.js'
import { generatorNotification } from '../notification/notificationService.js'

const getCMSData = catchAsync(async (req, res, next) => {
	logger.info('Inside getCMSData Controller')
	const cmsData = await CMS.findOne()
	if (!cmsData) {
		return next(new AppError('cms not found', 404))
	}
	handleResponse({ res, data: cmsData })
})

const updateCMSData = catchAsync(async (req, res, next) => {
	logger.info('Inside updateCMSData Controller')
	const { aboutUs, privacyPolicy, termAndCondition, communityGuideline } = req.body
	const cmsData = await CMS.findOne()
	if (!cmsData) {
		return next(new AppError('cms not found', 404))
	}
	const updateCMS = await factory.updateOne(
		CMS,
		{ _id: cmsData._id },
		{
			$set: {
				...(aboutUs && {
					aboutUs,
				}),
				...(privacyPolicy && {
					privacyPolicy,
				}),
				...(termAndCondition && {
					termAndCondition,
				}),
				...(communityGuideline && {
					communityGuideline,
				}),
			},
		}
	)
	if (!updateCMS) {
		return next(new AppError('cms not found', 404))
	}
	const admin = await factory.getOne(User, { role: 'admin' })
	await generatorNotification({
		description: `You have updated content page.`,
		generatorId: admin._id,
		receiverId: admin._id,
		itemId: admin._id,
		type: 'User',
	})
	handleResponse({ res, data: updateCMS })
})

export { getCMSData, updateCMSData }
