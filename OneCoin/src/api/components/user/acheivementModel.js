import mongoose from 'mongoose'
import db from '../../connections/dbConnection.js'

const { Schema } = mongoose

const AchievementSchema = new Schema(
	{
		name: {
			type: String,
			unique: true,
		},
		minimumMerge: { type: Number },
	},
	{
		timestamps: true,
	}
)

const Achievement = db.model('Achievement', AchievementSchema)

export default Achievement
