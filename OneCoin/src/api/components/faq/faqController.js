import factory from '../commonServices.js'
import catchAsync from '../../helpers/catchAsync.js'
import logger from '../../config/logger.js'
import { AppError, handleResponse } from '../../helpers/responseHandler.js'
import FAQ from './faqModel.js'

const getAllFAQ = catchAsync(async (req, res, next) => {
	logger.info('Inside getAllFAQ Controller')
	const { query } = req
	const faq = await factory.getAllWithPagination(FAQ, query)
	if (!faq.list?.length) {
		return next(new AppError('FAQ not found', 404))
	}

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

export { getAllFAQ, getFAQ }
