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

const platformVariablesSchema = new mongoose.Schema(
	{
		poolFees: {
			type: Number,
			default: 0,
		},
		CostPerKWh: {
			type: Number,
			default: 0,
		},
		maintenanceAndShippingCharges: {
			type: Number,
			default: 0,
		},
		tax: {
			type: Number,
			default: 0,
		},
	},
	options
)

const platformVariables = db.model('platformVariables', platformVariablesSchema)
module.exports.platformVariables = platformVariables
