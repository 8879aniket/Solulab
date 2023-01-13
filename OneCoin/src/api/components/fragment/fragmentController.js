import factory from '../commonServices.js'
import catchAsync from '../../helpers/catchAsync.js'
import logger from '../../config/logger.js'
import { AppError, handleResponse } from '../../helpers/responseHandler.js'
import Fragments from './fragmentModel.js'
import SellFragments from './sellFragmentModel.js'
import { getTotalPage, getSkipCount } from '../../helpers/common.js'

// eslint-disable-next-line no-unused-vars
const getAllFragments = catchAsync(async (req, res, next) => {
	logger.info('Inside getAllFragments Controller')
	const { query } = req
	query.isDisposed = false
	const fragments = await factory.getAllWithPagination(Fragments, query)
	handleResponse({ res, data: fragments })
})

const getFragment = catchAsync(async (req, res, next) => {
	logger.info('Inside fragment Controller')
	const { id } = req.params
	const fragment = await factory.getOne(Fragments, { _id: id }, 'currentOwner createdBy')
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
const getAllSellFragments = catchAsync(async (req, res, next) => {
	logger.info('Inside getAllSellFragments Controller')
	const { query } = req
	const queryObj = { ...query, isSold: false }
	const sellFragments = await factory.getAllWithPagination(SellFragments, queryObj, 'fragmentId')
	handleResponse({ res, data: sellFragments })
})

// eslint-disable-next-line no-unused-vars
const getAllSellFragmentsMarket = catchAsync(async (req, res, next) => {
	logger.info('Inside getAllSellFragments Controller')
	const { query } = req
	const { minPrice, maxPrice, sort = '-createdAt', search, sellType } = query

	let coorFilter = {}
	let priceFilter = {}
	if (minPrice && maxPrice) {
		priceFilter = {
			price: { $gte: Number(minPrice), $lte: Number(maxPrice) },
		}
	}
	let nameSearch = {}
	if (search) {
		nameSearch = {
			// eslint-disable-next-line security/detect-non-literal-regexp
			'fragmentId.name': new RegExp(search, 'gi'),
		}
	}

	if (query.xCoordinate && query.yCoordinate && query.zCoordinate) {
		coorFilter = {
			'fragmentId.xCoordinate': Number(query.xCoordinate),
			'fragmentId.yCoordinate': Number(query.yCoordinate),
			'fragmentId.zCoordinate': Number(query.zCoordinate),
		}
		delete query.xCoordinate
		delete query.yCoordinate
		delete query.zCoordinate
	}
	let sellObject = {}
	if (sellType) {
		sellObject = {
			sellType: sellType === 'float' ? 'variable' : 'fixed',
		}
	}

	const page = query.page * 1 || 1
	const limit = query.limit * 1 || 10
	const skip = (page - 1) * limit

	const list = await SellFragments.aggregate([
		{
			$match: {
				isSold: false,
			},
		},
		{
			$match: priceFilter,
		},
		{
			$match: sellObject,
		},
		{
			$lookup: {
				from: 'fragments',
				localField: 'fragmentId',
				foreignField: '_id',
				as: 'fragmentId',
			},
		},
		{
			$unwind: {
				path: '$fragmentId',
			},
		},
		{
			$match: { 'fragmentId.isAtMarketPlace': true },
		},
		{
			$match: coorFilter,
		},
		{
			$match: nameSearch,
		},
	])
		.sort(sort)
		.skip(skip)
		.limit(limit)

	const doc = await SellFragments.aggregate([
		{
			$match: {
				isSold: false,
			},
		},
		{
			$match: priceFilter,
		},
		{
			$match: sellObject,
		},
		{
			$lookup: {
				from: 'fragments',
				localField: 'fragmentId',
				foreignField: '_id',
				as: 'fragmentId',
			},
		},
		{
			$unwind: {
				path: '$fragmentId',
			},
		},
		{
			$match: { 'fragmentId.isAtMarketPlace': true },
		},
		{
			$match: coorFilter,
		},
		{
			$match: nameSearch,
		},
	])

	const totalItem = doc.length
	const currentPage = page || 1

	const totalPage = getTotalPage(totalItem, limit)
	const skipCount = getSkipCount(limit, currentPage)

	// const sellFragments = await factory.getAllWithPagination(SellFragments, query, 'fragmentId')
	handleResponse({ res, data: { list, totalItem, skipCount, totalPage } })
})

export { getAllFragments, getFragment, getAllSellFragments, getAllSellFragmentsMarket }
