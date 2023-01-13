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
		first_name: { type: String, trim: true },

		last_name: { type: String, trim: true },

		email: {
			type: String,
			lowercase: true,
			required: true,
			unique: true,
			trim: true,
		},

		password: { type: String, required: true, trim: true },

		country: { type: String, required: true, trim: true },

		country_code: { type: String, required: true, trim: true },

		image: { type: String },

		is_email_verified: { type: Boolean, default: false },

		confirmation_code: { type: String },

		otp: { type: String },

		otp_expiration_time: { type: Date },

		secret_key: { type: String },

		is_2fa: { type: Boolean, default: false },

		auth_type: {
			type: String,
			enum: ['AUTHENTICATOR', 'EMAIL', 'NONE', 'UNSET'],
			default: 'UNSET',
		},

		recovery_code: { type: String, require: true },

		reset_password_code: { type: String },

		reset_password_expires: { type: Date },

		active: { type: Boolean, default: true },

		noOfOrder: { type: Number },
	},
	options
)

const user = db.model('users', usersSchema)
module.exports.userModel = user
