import axios from 'axios'
import mongoose from 'mongoose'
import { Cart } from './cartModel'
import { Product } from '../admin/productModel'
import { platformVariables } from '../admin/platformVariablesModel'
import config from '../../config/index'
import logger from '../../middleware/logger'
import { handleResponse, handleError } from '../../config/requestHandler'
import { Log } from '../admin/logModel'

module.exports = {
	addToCart: async (req, res) => {
		try {
			const checkProduct = await Product.findOne({
				_id: req.body.productId,
			})

			if (checkProduct == null) {
				return res.status(404).send({
					status: 'error',
					message: 'Item dose not exist.',
				})
			}

			// if (checkProduct.quantity === checkProduct.bookedQty)
			// {
			// 	return res.status(404).send({
			// 		status: 'error',
			// 		message: 'Item is out of stock.',
			// 	})
			// }

			const checkCart = await Cart.find({
				userId: req.userId,
				productId: req.body.productId,
			})

			if (checkCart.length !== 0) {
				return res.status(403).send({
					status: 'error',
					message: 'Item already in cart.',
				})
			}

			Cart.create(
				{
					userId: req.userId,
					productId: req.body.productId,
				},
				(err, query) => {
					if (err) {
						res.status(500).send({
							status: 'error',
							message: 'Item not saved in cart.',
							error: err,
						})
					}
					if (query) {
						res.status(200).send({
							status: 'success',
							message: 'Item saved in cart successfully.',
							data: query,
						})
					}
				}
			)
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	getCart: async (req, res) => {
		try {
			Cart.find({ userId: req.userId }, (err, query) => {
				if (err) {
					res.status(500).send({
						status: 'error',
						message: 'Cant fetch cart.',
					})
				}
				if (query) {
					res.status(200).send({
						status: 'success',
						message: 'Cart fetch successfully.',
						data: query,
					})
				}
			}).populate('productId')
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	editCartQuantity: async (req, res) => {
		try {
			if (req.body.quantity === 0) {
				const deleteCart = await Cart.findOneAndDelete({
					userId: mongoose.Types.ObjectId(req.userId),
					productId: mongoose.Types.ObjectId(req.body.productId),
				})
				if (deleteCart) {
					res.status(200).send({
						status: 'success',
						message: 'Product deleted successfully.',
						data: deleteCart,
					})
				}
				res.status(400).send({
					status: 'error',
					message: 'Product not found or already deleted.',
				})
			} else {
				// const productData = await Product.findOne({
				// 	_id: req.body.productId,
				// });
				// if (!productData)
				// {
				// 	res.status(500).send({
				// 		status: 'error',
				// 		message: 'Product not found.',
				// 	})
				// }
				// if (req.body.quantity > (productData.quantity - productData.bookedQty))
				// {
				// 	res.status(500).send({
				// 		status: 'error',
				// 		message: 'Product is out of stock.',
				// 	})
				// }
				Cart.findOneAndUpdate(
					{ userId: req.userId, productId: req.body.productId },
					{ $set: { quantity: req.body.quantity } },
					{ returnOriginal: false },
					(err, query) => {
						if (err) {
							res.status(500).send({
								status: 'error',
								message: 'Cant fetch cart.',
							})
						}
						if (query) {
							res.status(200).send({
								status: 'success',
								message: 'Cart fetch successfully.',
								data: query,
							})
						}
					}
				)
			}
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	deleteFromCart: async (req, res) => {
		try {
			const deleteCartItem = await Cart.findOneAndDelete({
				productId: req.body.productId,
				userId: req.userId,
			})

			if (deleteCartItem) {
				return res.status(200).send({
					status: 'success',
					message: 'Item deleted from cart.',
					data: deleteCartItem,
				})
			}

			if (deleteCartItem == null) {
				return res.status(404).send({
					status: 'error',
					message: `${req.body.productId} does not exist on this user cart.`,
				})
			}
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	deleteCart: async (req, res) => {
		try {
			const deleteCart = await Cart.remove({
				userId: req.userId,
			})

			if (deleteCart) {
				return res.status(200).send({
					status: 'success',
					message: ' Cart deleted successfully.',
					data: deleteCart,
				})
			}

			if (deleteCart == null) {
				return res.status(404).send({
					status: 'error',
					message: `User does not have any item in cart.`,
				})
			}
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},
	// getAllProduct: async (req, res) => {
	// 	try {
	// 		const {
	// 			_id,
	// 		} = req.body

	// 		return res.status(200).send({
	// 			status: 'success',
	// 			message: 'product found ',
	// 			data: product,
	// 		})
	// 	} catch (err) {
	// 		return res
	// 			.status(500)
	// 			.send({ status: 'error', message: err.message })
	// 	}
	// },

	getAllProduct: async (req, res) => {
		try {
			const {
				minPrice,
				maxPrice,
				minPower,
				maxPower,
				ShortByPrice,
				ShortByDate,
				pagesize,
				pageNumber,
				userId,
			} = req.body

			let sortByValue

			if (ShortByPrice === true) {
				sortByValue = { price: 1 }
			}

			if (ShortByDate === true) {
				sortByValue = { date: 1 }
			}

			const query = { $and: [] }

			query.$and.push({ isArchive: false })

			if (minPrice) {
				query.$and.push({ price: { $gt: minPrice } })
			}

			if (maxPrice) {
				query.$and.push({ price: { $lt: maxPrice } })
			}

			if (minPower) {
				query.$and.push({ power: { $gt: minPower } })
			}

			if (maxPower) {
				query.$and.push({ power: { $lt: maxPower } })
			}

			let product = await Product.find(query)
				.sort(sortByValue)
				.skip(pagesize * (pageNumber - 1))
				.limit(pagesize)

			product = JSON.parse(JSON.stringify(product))
			const promise = product.map(async (productElement) => {
				let cartQuantity = 0
				if (userId) {
					const cart = await Cart.findOne({
						productId: mongoose.Types.ObjectId(productElement._id),
						userId: mongoose.Types.ObjectId(userId),
					})
					if (cart) {
						cartQuantity = cart.quantity
					}
				}
				productElement.cartQuantity = cartQuantity
			})
			// wait till promise finished
			await Promise.all(promise)

			if (product == null) {
				// console.log(productCheck)
				return res.status(404).send({
					status: 'error',
					message: `No product exist.`,
				})
			}
			return res.status(200).send({
				status: 'success',
				message: 'Product found.',
				data: product,
			})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	getProduct: async (req, res) => {
		try {
			let cartQuantity = 0
			if (req.body.userId) {
				const cart = await Cart.findOne({
					userId: mongoose.Types.ObjectId(req.body.userId),
					productId: mongoose.Types.ObjectId(req.body._id),
				})
				if (cart) {
					cartQuantity = cart.quantity
				}
			}
			let product = await Product.findOne({ _id: req.body._id })
			product = product.toObject()

			if (product == null) {
				// console.log(productCheck)
				return res.status(404).send({
					status: 'error',
					message: `Product does not exist.`,
				})
			}
			Log.create({
				activity: ` ${req.body.name} product view.`,
				user_id: req.userId,
			})
			product.cartQuantity = cartQuantity
			return res.status(200).send({
				status: 'success',
				message: 'Product found.',
				data: product,
			})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	profitCalculator: async (req, res) => {
		try {
			const { productId, duration } = req.body
			if (!productId) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Product id not provided.',
				})
			}
			if (!duration) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Duration not provided.',
				})
			}

			const productData = await Product.findOne({
				_id: productId,
			})

			if (!productData) {
				return handleError({
					res,
					statusCode: 404,
					message: 'Product not found.',
				})
			}
			let electricityCost = 0
			let poolFees = 0
			const defaults = await platformVariables.findOne()
			if (defaults && defaults.CostPerKWh) {
				electricityCost = defaults.CostPerKWh
			}
			if (defaults && defaults.poolFees) {
				poolFees = defaults.poolFees
			}
			const hashRate = productData.hash_power
			const { power } = productData

			const networkHashRateObj = await axios.get(config.hashRateUrl)
			const networkHashRate = networkHashRateObj.data / 1000

			const hashrateShare = hashRate / networkHashRate

			const dailyBlockRewardObj = await axios.get(
				config.bitcoinPerBlockUrl
			)
			const dailyBlockReward = dailyBlockRewardObj.data * 144 /// blocks per day

			const dailyBitcoins = hashrateShare * dailyBlockReward

			const bitcoinPriceObj = await axios.get(config.bitcoinPriceUrl)
			const bitcoinPriceInUsd = bitcoinPriceObj.data.data.amount

			const dailyRevenue = bitcoinPriceInUsd * dailyBitcoins

			const powerKiloWatt = power / 1000 // convert in kW

			const powerKiloWattPerDay = powerKiloWatt * 24 // convert in hr to day

			const dailyCost = powerKiloWattPerDay * electricityCost

			let dailyProfit = dailyRevenue - dailyCost

			if (poolFees !== 0) {
				const poolFeesCost = (2 * dailyRevenue) / 100
				dailyProfit -= poolFeesCost
			}

			let profit = dailyProfit * duration * 30 // 30 is converted into days
			profit = profit.toFixed(2)
			let dailyProfitRatio = (dailyProfit / dailyCost) * 100
			dailyProfitRatio = Math.round(dailyProfitRatio.toFixed(2))

			return handleResponse({
				res,
				data: { profit, dailyProfitRatio },
			})
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},

	getOrderSummary: async (req, res) => {
		try {
			const { userId } = req
			let tax = 0
			let maintenanceAndShipping = 0
			let totalPrice

			const productList = await Cart.aggregate([
				{
					$match: {
						userId: mongoose.Types.ObjectId(userId),
					},
				},
				{
					$lookup: {
						from: 'products',
						localField: 'productId',
						foreignField: '_id',
						as: 'productDetails',
					},
				},
				{
					$unwind: '$productDetails',
				},
				{
					$project: {
						_id: false,
						qty: '$quantity',
						productPrice: '$productDetails.price',
						total: {
							$multiply: ['$productDetails.price', '$quantity'],
						},
					},
				},
			])
			if (productList.length === 0) {
				return handleResponse({ res, msg: 'Cart empty.' })
			}
			const defaults = await platformVariables.findOne()
			const price = productList.reduce((accumulator, item) => {
				return accumulator + item.total
			}, 0)
			totalPrice = price
			if (defaults && defaults.tax) {
				tax = defaults.tax
				totalPrice += tax
			}

			if (defaults && defaults.maintenanceAndShippingCharges) {
				maintenanceAndShipping = defaults.maintenanceAndShippingCharges
				totalPrice += maintenanceAndShipping
			}

			return handleResponse({
				res,
				data: { price, tax, maintenanceAndShipping, totalPrice },
			})
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},
}
