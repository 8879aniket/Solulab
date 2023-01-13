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

const adminSchema = new mongoose.Schema(
	{
		adminName: { type: String, required: true },

		adminEmail: { type: String, required: true, unique: true },

		country_code: { type: String, required: true, trim: true },

		adminNumber: { type: String, required: true, unique: true },

		role: { type: String, required: true, ref: 'role' },

		fullName: { type: String, default: '' },

		image: {},

		active: { type: Boolean, default: true },

		password: { type: String },

		userType: { type: String, default: 'admin' },

		otp: { type: Number },

		otpExpireTime: { type: Date },

		adminPermissions: {
			adminManagement: {
				view: Boolean,
				add: Boolean,
				edit: Boolean,
				delete: Boolean,
				disable: Boolean,
			},
			roleManagement: {
				view: Boolean,
				add: Boolean,
				edit: Boolean,
				delete: Boolean,
				disable: Boolean,
			},
		},
	},
	options
)

const Admin = db.model('Admin', adminSchema)
module.exports.Admin = Admin
