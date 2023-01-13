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

const productSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },

		itemCode: { type: String, require: true, unique: true },

		price: { type: Number, required: true },

		cost: { type: Number, required: true },

		hash_power: { type: Number },

		hash_power_unit: { type: String, default: 'TH' },

		power: { type: Number },

		output_usd_btc: { type: Number },

		// output_btc: { type: Number, required: true },

		algorithm: { type: String, trim: true },

		isArchive: { type: Boolean, default: false },

		quantity: { type: Number, required: true, default: 0 },

		bookedQty: { type: Number, default: 0 },

		monthlyMaintenance: { type: Number },

		batchId: { type: String },

		additionalCost: { type: Number },

		status: { type: String },

		specification: { type: String },

		warranty: { type: String },

		// deliveryDate: { type: Date, required: true },

		image: [{}],

		description: {
			type: String,
			required: true,
			minlength: 100,
			maxlength: 1000,
			trim: true,
		},

		// average_downtime: { type: String, trim: true },
		Miner_profits_history: { type: String, default: 0 },

		average_uptime_downtime: { type: String, trim: true },
	},
	options
)

const Product = db.model('Product', productSchema)
module.exports.Product = Product
