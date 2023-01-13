import mongoose from 'mongoose'
import db from '../../connections/dbConnection.js'

const { Schema } = mongoose
const { ObjectId } = Schema.Types

const notificationSchema = new Schema(
	{
		description: String,
		generatorId: {
			type: ObjectId,
			ref: 'User',
		},
		receiverId: {
			type: ObjectId,
			refPath: 'Users',
		},
		itemId: {
			type: ObjectId,
			refPath: 'itemType',
			required: true,
		},
		itemType: {
			type: String,
			enum: ['User', 'Fragments', 'Achievement', 'SupportRequest'],
		},
		isRead: {
			type: Boolean,
			default: false,
		},
		readAt: {
			type: Date,
			default: null,
		},
	},
	{
		timestamps: true,
	}
)

const Notification = db.model('notification', notificationSchema)

export default Notification
