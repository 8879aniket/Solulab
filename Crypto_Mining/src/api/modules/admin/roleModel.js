import mongoose from 'mongoose'
import db from '../../connections/db'

const options = {
	versionKey: false,
	timestamps: {
		createdAt: true,
		updatedAt: 'modifiedAt',
	},
}

const roleSchema = new mongoose.Schema(
	{
		roleName: { type: String, required: true, trim: true },
		createdBy: { type: String, required: true, ref: 'Admin' },

		inventoryManagement: {
			view: {
				type: Boolean,
				default: false,
			},
			add: {
				type: Boolean,
				default: false,
			},
			edit: {
				type: Boolean,
				default: false,
			},
			delete: {
				type: Boolean,
				default: false,
			},
		},

		userManagement: {
			view: {
				type: Boolean,
				default: false,
			},
			add: {
				type: Boolean,
				default: false,
			},
			edit: {
				type: Boolean,
				default: false,
			},
			delete: {
				type: Boolean,
				default: false,
			},
		},

		orderManagement: {
			view: {
				type: Boolean,
				default: false,
			},
			add: {
				type: Boolean,
				default: false,
			},
			edit: {
				type: Boolean,
				default: false,
			},
			delete: {
				type: Boolean,
				default: false,
			},
		},

		// contentManagement: {
		// 	view: {
		// 		type: Boolean,
		// 		default: false,
		// 	},
		// 	add: {
		// 		type: Boolean,
		// 		default: false,
		// 	},
		// 	edit: {
		// 		type: Boolean,
		// 		default: false,
		// 	},
		// 	delete: {
		// 		type: Boolean,
		// 		default: false,
		// 	},
		// },
		// platformVariable: {
		// 	view: {
		// 		type: Boolean,
		// 		default: false,
		// 	},
		// 	edit: {
		// 		type: Boolean,
		// 		default: false,
		// 	},
		// },
	},
	options
)

const Role = db.model('role', roleSchema)
module.exports.Role = Role
