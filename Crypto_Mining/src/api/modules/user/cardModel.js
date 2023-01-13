import mongoose from 'mongoose'
import db from '../../connections/db'

const options = {
	versionKey: false,
	timestamps: {
		createdAt: true,
		updatedAt: 'modifiedAt',
	},
}

const usersSchema = new mongoose.Schema(
	{
		user_id: { type: mongoose.Schema.ObjectId, ref: 'users' },

		card_holder_name: { type: String, required: true, trim: true },

		card_number: { type: Number, required: true, trim: true },

		expiry_month: { type: Number, required: true, trim: true },

		expiry_year: { type: Number, required: true, trim: true },

		cvv: { type: Number, required: true, trim: true },
	},
	options
)

const card = db.model('cards', usersSchema)
module.exports.cardModel = card
