import factory from '../commonServices.js'
import catchAsync from '../../helpers/catchAsync.js'
import logger from '../../config/logger.js'
import { AppError, handleResponse } from '../../helpers/responseHandler.js'
import TradingHistory from './tradingHistoryModel.js'

// eslint-disable-next-line no-unused-vars
const getAllTradingHistory = catchAsync(async (req, res, next) => {
	logger.info('Inside getAllTradingHistory Controller')
	const { query } = req
	const tradingHistory = await factory.getAllWithPaginationAndPopulation(TradingHistory, query, [
		'buyer',
		'seller',
		'fragmentId',
	])
	handleResponse({ res, data: tradingHistory })
})

const getTradingHistory = catchAsync(async (req, res, next) => {
	logger.info('Inside getTradingHistory Controller')
	const { id } = req.params
	// const tradingHistory = await factory.getOne(
	// 	TradingHistory,
	// 	{ fragmentId: id },
	// 	'buyer,seller,fragmentId'
	// )
	const tradingHistory = await factory.getAllWithPaginationAndPopulation(
		TradingHistory,
		{ fragmentId: id },
		['buyer', 'seller', 'fragmentId']
	)
	if (!tradingHistory) {
		return next(new AppError('fragments not found', 404))
	}
	handleResponse({ res, data: tradingHistory })
})

export { getAllTradingHistory, getTradingHistory }
