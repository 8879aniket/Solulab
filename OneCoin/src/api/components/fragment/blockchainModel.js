import mongoose from 'mongoose'
import db from '../../connections/dbConnection.js'

const { Schema } = mongoose
const BlockchainSchema = new Schema(
	{
		lastMintedFragment: { type: Number, default: -500000 },
	},
	{
		timestamps: true,
	}
)

const Blockchain = db.model('Blockchain', BlockchainSchema)

export default Blockchain
