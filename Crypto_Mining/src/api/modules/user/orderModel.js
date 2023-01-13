import mongoose from 'mongoose'
import db from '../../connections/db'

const options = {
	versionKey: false,
	timestamps: {
		createdAt: true,
		updatedAt: 'modifiedAt',
	},
}

const ordersSchema = new mongoose.Schema(
	{
		order_id: { type: String, require: true, unique: true },

		user_id: {
			type: mongoose.Types.ObjectId,
			required: true,
			ref: 'users',
		},

		payment_id: { type: String },

		products: [
			{
				product_id: {
					type: mongoose.Types.ObjectId,
					required: true,
					ref: 'products',
				},
				qty: {
					type: Number,
					default: 1,
				},
				price: {
					type: Number,
				},
				name: {
					type: String,
				},
			},
		],

		price: { type: Number, require: true },

		maintenance_shipping_charge: { type: Number, default: 0 },

		tax: { type: Number, default: 0 },

		total_price: { type: Number, require: true },

		address: { type: String, require: true },

		name: { type: String, require: true },

		status: {
			type: String,
			enum: ['INVOICED', 'PACKED', 'SHIPPED', 'DELIVERED'],
			default: 'INVOICED',
		},

		payment_type: { type: String, enum: ['FIAT', 'CRYPTO'], require: true },

		payment_method: {
			type: String,
			enum: ['CREDIT', 'DEBIT', 'OTHER'],
			require: true,
		},
	},
	options
)

const order = db.model('orders', ordersSchema)
module.exports.orderModel = order
