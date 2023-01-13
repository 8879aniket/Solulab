// @ts-nocheck

import { model, Schema } from 'mongoose'

const OtpSchema = model(
	'Otp',
	new Schema(
		{
			otp: { type: Number, required: true },

			user: { type: String, ref: 'User', required: true, unique: true },
		},
		{ timestamps: true, _id: false, toJSON: { virtuals: true } }
	)
)

const Otp = db.model('Otp', OtpSchema)
module.exports.Otp = Otp
