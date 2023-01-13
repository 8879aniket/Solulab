import factory from '../commonServices.js'
import catchAsync from '../../helpers/catchAsync.js'
import logger from '../../config/logger.js'
import { AppError, handleResponse } from '../../helpers/responseHandler.js'
import Blog from './blogModel.js'

// eslint-disable-next-line no-unused-vars
const getAllBlog = catchAsync(async (req, res, next) => {
	logger.info('Inside getAllBlog Controller')
	const { query } = req
	const blog = await factory.getAllWithPaginationAndPopulation(Blog, query, ['createdBy'])

	handleResponse({ res, data: blog })
})

const getBlog = catchAsync(async (req, res, next) => {
	logger.info('Inside getBlog Controller')
	const { id } = req.params
	const blog = await factory.getOne(Blog, { _id: id }, 'createdBy')
	if (!blog) {
		return next(new AppError('blog not found', 404))
	}

	handleResponse({ res, data: blog })
})

export { getAllBlog, getBlog }
