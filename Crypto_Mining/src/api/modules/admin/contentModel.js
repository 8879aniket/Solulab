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

const contentSchema = new mongoose.Schema(
	{
		aboutUs: { type: String, default: '' },
		privacy: { type: String, default: '' },
		termsAndConditions: { type: String, default: '' },
	},
	options
)

const Content = db.model('Content', contentSchema)
module.exports.Content = Content
