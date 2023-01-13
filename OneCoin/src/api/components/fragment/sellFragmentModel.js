/* eslint-disable func-names */
import mongoose from 'mongoose'
import db from '../../connections/dbConnection.js'

const { Schema } = mongoose
const { ObjectId } = Schema.Types

const sellFragsmentSchema = new Schema(
	{
		fragmentId: {
			type: ObjectId,
			ref: 'Fragments',
			required: true,
		},
		currentOwner: {
			type: ObjectId,
			ref: 'User',
			required: true,
		},
		sellType: {
			type: String,
			enum: ['fixed', 'variable'],
			default: 'fixed',
		},
		price: { type: Number },
		isSold: { type: Boolean, default: false },
		soldPrice: {
			type: Number,
		},
	},
	{
		timestamps: true,
	}
)

const SellFragsments = db.model('sellFragsments', sellFragsmentSchema)

export default SellFragsments
