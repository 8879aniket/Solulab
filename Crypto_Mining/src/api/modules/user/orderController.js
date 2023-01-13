import mongoose from 'mongoose'
import { v1 as uuidv1 } from 'uuid'
import logger from '../../middleware/logger'
import { handleResponse, handleError } from '../../config/requestHandler'
import { orderModel } from './orderModel'
import { userModel } from './userModel'
import { Cart } from './cartModel'
import { Product } from '../admin/productModel'
import { platformVariables } from '../admin/platformVariablesModel'
import config from '../../config/index'

const stripe = require('stripe')(config.stripe.secretKey)

module.exports = {
	orderPlace: async (req, res) => {
		try {
			const {
				paymentId,
				products,
				price,
				maintenanceShippingCharge,
				tax,
				totalPrice,
				address,
				paymentType,
				paymentMethod,
			} = req.body
			const paymentTypeArray = ['FIAT', 'CRYPTO']
			const paymentMethodArray = ['CREDIT', 'DEBIT', 'OTHER']
			if (!paymentId) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Payment id not provided.',
				})
			}
			if (!products) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Product array not provided.',
				})
			}
			if (!price) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Price not provided.',
				})
			}
			if (!maintenanceShippingCharge) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Maintenance shipping charge not provided.',
				})
			}
			if (!tax) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Tax not provided.',
				})
			}
			if (!totalPrice) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Total price not provided.',
				})
			}
			if (!address) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Address not provided.',
				})
			}
			if (!paymentType) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Type not provided.',
				})
			}
			if (!paymentMethod) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Payment method not provided.',
				})
			}
			if (!paymentTypeArray.includes(paymentType)) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Payment type should be FIAT or CRYPTO.',
				})
			}
			if (!paymentMethodArray.includes(paymentMethod)) {
				return handleError({
					res,
					statusCode: 400,
					message:
						'Payment method should be CREDIT or DEBIT or OTHER.',
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

			const orderObj = new orderModel({
				order_id: uuidv1(),
				user_id: mongoose.Types.ObjectId(req.userId),
				payment_id: paymentId,
				products,
				price,
				maintenance_shipping_charge: maintenanceShippingCharge,
				tax,
				total_price: totalPrice,
				address,
				payment_type: paymentType,
				payment_method: paymentMethod,
			})

			orderObj.save((err) => {
				if (err) {
					return handleError({ res, err })
				}
				return handleResponse({ res, msg: 'Order placed.' })
			})
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},

	getOrders: async (req, res) => {
		try {
			const user = await userModel.findById(req.userId)
			if (!user) {
				return handleError({
					res,
					statusCode: 404,
					message: 'User not found.',
				})
			}

			const orders = await orderModel.aggregate([
				{
					$match: {
						user_id: mongoose.Types.ObjectId(req.userId),
					},
				},
				{
					$lookup: {
						from: 'products',
						localField: 'products.product_id',
						foreignField: '_id',
						as: 'productDetails',
					},
				},
			])
			if (orders.length === 0) {
				return handleResponse({
					res,
					msg: 'No orders found.',
					data: [],
				})
			}
			return handleResponse({ res, data: orders })
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},

	payment: async (req, res) => {
		try {
			const {
				name,
				cardNumber,
				expMonth,
				expYear,
				cvv,
				address,
				paymentType,
				paymentMethod,
			} = req.body
			let totalPayableWithouCharge = 0
			let maintenanceShippingCharge = 0
			let tax = 0
			const products = []
			const cartIds = []
			const paymentTypeArray = ['FIAT', 'CRYPTO']
			const paymentMethodArray = ['CREDIT', 'DEBIT', 'OTHER']
			if (!name) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Name not provided.',
				})
			}
			if (!address) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Address not provided.',
				})
			}
			if (!paymentType) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Payment type not provided.',
				})
			}
			if (!paymentMethod) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Payment method not provided.',
				})
			}
			if (!paymentTypeArray.includes(paymentType)) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Payment type should be FIAT or CRYPTO.',
				})
			}
			if (!paymentMethodArray.includes(paymentMethod)) {
				return handleError({
					res,
					statusCode: 400,
					message:
						'Payment method should be CREDIT or DEBIT or OTHER.',
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

			// checking cart
			const cart = await Cart.find({
				userId: req.userId,
			})
			if (cart.length === 0) {
				return handleError({
					res,
					statusCode: 400,
					message: 'Cart is empty.',
				})
			}

			// creating a card token for payment
			const token = await stripe.tokens.create({
				card: {
					number: cardNumber,
					exp_month: expMonth,
					exp_year: expYear,
					cvc: cvv,
				},
			})

			// create a products array and calculate the price with qty
			const promise = cart.map(async (cartElement) => {
				cartIds.push(cartElement._id)
				if (cartElement.quantity > 0) {
					const product = await Product.findById(
						mongoose.Types.ObjectId(cartElement.productId)
					)
					if (product) {
						const productObj = {
							product_id: product._id,
							price: product.price,
							qty: cartElement.quantity,
							name: product.name,
						}
						products.push(productObj)
						totalPayableWithouCharge +=
							product.price * cartElement.quantity
					}
				}
			})
			// wait till promise finished
			await Promise.all(promise)

			// getting default values
			const defaults = await platformVariables.findOne()
			if (defaults && defaults.maintenanceAndShippingCharges) {
				maintenanceShippingCharge =
					defaults.maintenanceAndShippingCharges
			}
			if (defaults && defaults.tax) {
				tax = defaults.tax
			}

			// adding default values to calculate the final payable price
			const totalPayable =
				totalPayableWithouCharge + maintenanceShippingCharge + tax

			// if token generated then proceed to payment and place the order

			if (!user.noOfOrder) {
				user.noOfOrder = 0
			}
			const orderNumber = user.noOfOrder + 1
			await userModel.findOneAndUpdate(
				{ _id: req.userId },
				{ $set: { noOfOrder: orderNumber } },
				{ new: true }
			)

			if (token) {
				const orderObj = new orderModel({
					order_id: uuidv1(),
					user_id: mongoose.Types.ObjectId(req.userId),
					products,
					price: totalPayableWithouCharge,
					maintenance_shipping_charge: maintenanceShippingCharge,
					tax,
					total_price: totalPayable,
					address,
					name,
					payment_type: paymentType,
					payment_method: paymentMethod,
				})
				// order place
				orderObj.save((err, orderDetail) => {
					if (err) {
						return handleError({ res, err })
					}

					// stripe payment if order successfully placed
					stripe.customers
						.create({
							name,
							email: user.email,
							source: token.id,
						})
						.then((customer) =>
							stripe.charges.create({
								amount: totalPayable * 100,
								currency: 'usd',
								customer: customer.id,
							})
						)
						.then(async (payment) => {
							// updating payment id on payment done
							orderDetail.payment_id = payment.id
							await orderDetail.save()

							let productData
							orderDetail.products.map(async (element) => {
								productData = await Product.findById(
									mongoose.Types.ObjectId(element.product_id)
								)
								productData.bookedQty += element.qty
								await productData.save()
							})

							// doing cart empty
							await Cart.deleteMany({ _id: { $in: cartIds } })

							return handleResponse({
								res,
								msg: 'Order placed successfully.',
							})
						})
						.catch(async () => {
							// deleting order if payment not done
							await orderModel.findOneAndDelete({
								_id: mongoose.Types.ObjectId(orderDetail._id),
							})
							return handleError({
								res,
								statusCode: 400,
								message:
									'Something went wrong! please try again later.',
							})
						})
				})
			}
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err, message: err.message })
		}
	},
}
