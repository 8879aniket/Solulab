import factory from '../commonServices.js'
import catchAsync from '../../helpers/catchAsync.js'
import logger from '../../config/logger.js'
import { AppError, handleResponse } from '../../helpers/responseHandler.js'

import SupportRequest from './supportReqModel.js'
import { filterObj } from '../../helpers/common.js'
import Email from '../../helpers/email.js'
import config from '../../config/config.js'
import { generatorNotification } from '../notification/notificationService.js'
import User from '../user/userModel.js'

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
	const SR = await factory.getOne(SupportRequest, { _id: id })
	if (!SR) {
		return next(new AppError('support request not found', 404))
	}

	handleResponse({ res, data: SR })
})

const createSupportReq = catchAsync(async (req, res, next) => {
	logger.info('Inside createSupportReq Controller')

	const dataObj = filterObj(req.body, 'subject', 'description')
	const { _id } = req.user
	const images = []
	req.files?.forEach((el) => {
		images.push({ name: el.originalname, link: el.location, key: el.key })
	})
	const SR = await factory.createOne(SupportRequest, { ...dataObj, createdBy: _id, images })
	if (!SR) {
		return next(new AppError('Failed to create support request', 400))
	}
	const admin = await factory.getOne(User, { role: 'admin' })
	await generatorNotification({
		description: `You have got support request from the ${req.user?.name}.`,
		generatorId: _id,
		receiverId: admin._id,
		itemId: SR._id,
		type: 'SupportRequest',
	})
	new Email({ to: config.helpdesk_email, name: 'One Coin Helpdesk' }).text({
		subject: dataObj.subject,
		text: dataObj.description,
	})

	handleResponse({ res, data: SR })
})

export { getAllSupportReq, getSupportReq, createSupportReq }
