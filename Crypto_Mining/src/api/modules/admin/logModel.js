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

const logSchema = new mongoose.Schema(
	{
		activity: { type: String, require: true },
		user_id: { type: mongoose.Schema.ObjectId },
	},
	options
)

const Log = db.model('log', logSchema)
module.exports.Log = Log
