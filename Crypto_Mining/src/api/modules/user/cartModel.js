// import joi from 'joi'
import mongoose from 'mongoose'
import db from '../../connections/db'

const options = {
	versionKey: false,
	timestamps: {
		createdAt: true,
		updatedAt: 'modifiedAt',
	},
}

const cartSchema = new mongoose.Schema(
	{
		productId: {
			type: mongoose.Schema.ObjectId,
			ref: 'Product',
			required: true,
		},

		userId: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },

		quantity: { type: Number, default: 1 },
	},
	options
)

const Cart = db.model('Cart', cartSchema)
module.exports.Cart = Cart
