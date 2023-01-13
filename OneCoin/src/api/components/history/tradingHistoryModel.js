import mongoose from 'mongoose'
import db from '../../connections/dbConnection.js'

const { Schema } = mongoose
const { ObjectId } = Schema.Types

const TradingHistorySchema = new Schema(
	{
		seller: {
			type: ObjectId,
			ref: 'User',
		},
		buyer: {
			type: ObjectId,
			ref: 'User',
		},
		fragmentId: {
			type: ObjectId,
			ref: 'Fragments',
		},
		sellType: {
			type: String,
			enum: ['fixed price', 'variable price'],
			default: 'fixed price',
		},
		price: { type: Number },
		serviceCharge: { type: Number, default: 0 },
		event: {
			type: String,
			enum: ['list', 'sale'],
			default: 'sale',
		},
	},
	{
		timestamps: true,
	}
)

const TradingHistory = db.model('TradingHistory', TradingHistorySchema)

export default TradingHistory
