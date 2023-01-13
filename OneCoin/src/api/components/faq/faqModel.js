import mongoose from 'mongoose'
import db from '../../connections/dbConnection.js'

const { Schema } = mongoose
const { ObjectId } = Schema.Types

const FAQSchema = new Schema(
	{
		question: {
			type: String,
			required: true,
		},
		answer: {
			type: String,
			required: true,
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

const FAQ = db.model('FAQ', FAQSchema)

export default FAQ
