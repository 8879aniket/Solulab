import mongoose from 'mongoose'
import db from '../../connections/dbConnection.js'

const CMSSchema = new mongoose.Schema(
	{
		aboutUs: {
			type: String,
			default: 'Some Data',
		},
		privacyPolicy: {
			type: String,
			default: 'Some Data',
		},
		termAndCondition: {
			type: String,
			default: 'Some Data',
		},
		communityGuideline: {
			type: String,
			default: 'Some Data',
		},
	},
	{
		timestamps: true,
	}
)

const CMS = db.model('CMS', CMSSchema)

export default CMS
