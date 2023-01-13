import mongoose from 'mongoose'
import logger from '../../middleware/logger'
import { handleResponse, handleError } from '../../config/requestHandler'
import { userModel } from './userModel'
import { cardModel } from './cardModel'

module.exports = {
	getCards: async (req, res) => {
		try {
			const user = await userModel.findById(req.userId)
			if (!user) {
				return handleError({
					res,
					statusCode: 404,
					message: 'User not found.',
				})
			}
			const conditions = {
				user_id: req.userId,
			}
			const cardData = await cardModel.find(conditions)
			if (cardData.length === 0) {
				return handleError({
					res,
					statusCode: 404,
					message: 'No card found.',
				})
			}

			return handleResponse({ res, data: cardData })
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},

	postCard: async (req, res) => {
		try {
			const { cardHolderName, cardNumber, expiryMonth, expiryYear, cvv } =
				req.body
			if (!cardHolderName) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Card holder name not provided.',
				})
			}
			if (!cardNumber) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Card number not provided.',
				})
			}
			if (!expiryMonth) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Expiry month not provided.',
				})
			}
			if (!expiryYear) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Expiry year not provided.',
				})
			}
			if (!cvv) {
				return handleError({
					res,
					statusCode: 400,
					message: 'CVV not provided.',
				})
			}
			const user = await userModel.findById(req.userId)
			if (!user) {
				return handleError({
					res,
					statusCode: 404,
					message: 'User not found.',
				})
			}

			const conditions = {
				user_id: req.userId,
				card_number: cardNumber,
			}
			const cardCheck = await cardModel.findOne(conditions)
			if (cardCheck) {
				return handleError({
					res,
					statusCode: 409,
					message: 'Card number already exist for this user.',
				})
			}

			const cartObj = new cardModel({
				user_id: user._id,
				card_holder_name: cardHolderName,
				card_number: cardNumber,
				expiry_month: expiryMonth,
				expiry_year: expiryYear,
				cvv,
			})
			cartObj.save((err) => {
				if (err) {
					return handleError({ res, err })
				}
				return handleResponse({ res, msg: 'Card saved.' })
			})
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},

	updateCard: async (req, res) => {
		try {
			const {
				cardId,
				cardHolderName,
				cardNumber,
				expiryMonth,
				expiryYear,
				cvv,
			} = req.body
			if (!cardId) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Card id not provided.',
				})
			}
			if (!cardHolderName) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Card holder name not provided.',
				})
			}
			if (!cardNumber) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Card number not provided.',
				})
			}
			if (!expiryMonth) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Expiry month not provided.',
				})
			}
			if (!expiryYear) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Expiry year not provided.',
				})
			}
			if (!cvv) {
				return handleError({
					res,
					statusCode: 400,
					message: 'CVV not provided.',
				})
			}
			const user = await userModel.findById(req.userId)
			if (!user) {
				return handleError({
					res,
					statusCode: 404,
					message: 'User not found.',
				})
			}

			const conditions = {
				_id: { $ne: mongoose.Types.ObjectId(cardId) },
				user_id: req.userId,
				card_number: cardNumber,
			}
			const cardCheck = await cardModel.findOne(conditions)
			if (cardCheck) {
				return handleError({
					res,
					statusCode: 409,
					message: 'Card number already exist for this user.',
				})
			}

			const card = await cardModel.findById(
				mongoose.Types.ObjectId(cardId)
			)
			if (!card) {
				return handleError({
					res,
					statusCode: 404,
					message: 'Card is not found or deleted.',
				})
			}
			card.card_holder_name = cardHolderName
			card.card_number = cardNumber
			card.expiry_month = expiryMonth
			card.expiry_year = expiryYear
			card.cvv = cvv
			card.save((err) => {
				if (err) {
					return handleError({ res, err })
				}
				return handleResponse({ res, msg: 'Card updated.' })
			})
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},

	deleteCard: async (req, res) => {
		try {
			const { cardId } = req.body
			if (!cardId) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Card id not provided.',
				})
			}
			const user = await userModel.findById(req.userId)
			if (!user) {
				return handleError({
					res,
					statusCode: 404,
					message: 'User not found.',
				})
			}

			const card = await cardModel.findById(
				mongoose.Types.ObjectId(cardId)
			)
			if (!card) {
				return handleError({
					res,
					statusCode: 404,
					message: 'Card is not found or already deleted.',
				})
			}

			cardModel.deleteOne(
				{ _id: mongoose.Types.ObjectId(cardId) },
				(err) => {
					if (err) {
						return handleError({ res, err })
					}
					return handleResponse({ res, msg: 'Card deleted.' })
				}
			)
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},
}
