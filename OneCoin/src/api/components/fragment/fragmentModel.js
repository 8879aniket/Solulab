import mongoose from 'mongoose'
import db from '../../connections/dbConnection.js'

const { Schema } = mongoose
const { ObjectId } = Schema.Types
const FragmentsSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
		},
		tokenID: { type: String, required: true },
		blockchainId: { type: String },
		transactionHash: { type: String },
		ownerWalletAddress: { type: String },
		price: { type: Number },
		floatInitialPrice: { type: Number },
		fragmentIPFS: { type: Array, default: [] },
		isAtMarketPlace: { type: Boolean, default: false },

		xCoordinate: { type: Number, required: true },
		yCoordinate: { type: Number, required: true },
		zCoordinate: { type: Number, required: true },
		mergeCoordinate: [{ x: Number, y: Number, z: Number }],
		isMerged: { type: Boolean, default: false },
		position: {
			type: Number,
		},
		description: { type: String, default: '' },
		currentOwner: { type: ObjectId, ref: 'User' },
		// fragmentType: {
		// 	type: String,
		// 	default: 'active',
		// 	enum: ['active', 'grouped'],
		// },
		isDisposed: {
			type: Boolean,
			default: false,
		},
		createdBy: { type: ObjectId, ref: 'User' },
		// isActive: { type: Boolean, default: true },
	},
	{
		timestamps: true,
	}
)

const Fragments = db.model('Fragments', FragmentsSchema)

export default Fragments
