import mongoose from 'mongoose'
import db from '../../connections/dbConnection.js'

const { Schema } = mongoose
const { ObjectId } = Schema.Types

const BlogSchema = new Schema(
	{
		title: { type: String },
		description: { type: String },
		blogImage: { type: Object },
		createdBy: {
			type: ObjectId,
			ref: 'User',
		},
	},
	{
		timestamps: true,
	}
)

const Blog = db.model('Blog', BlogSchema)

export default Blog
