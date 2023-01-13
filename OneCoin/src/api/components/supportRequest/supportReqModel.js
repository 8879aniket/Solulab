import mongoose from 'mongoose'
import db from '../../connections/dbConnection.js'

const { Schema } = mongoose
const { ObjectId } = Schema.Types

const SupportRequestSchema = new Schema(
	{
		subject: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		images: [Object],
		isResolved: {
			type: Boolean,
			default: false,
		},
		createdBy: {
			type: ObjectId,
			ref: 'User',
		},
	},
	{
		timestamps: true,
	}
)

const SupportRequest = db.model('SupportRequest', SupportRequestSchema)

export default SupportRequest
