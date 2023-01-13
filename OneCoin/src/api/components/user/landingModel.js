import mongoose from 'mongoose'

const { Schema, model } = mongoose
const { ObjectId } = Schema.Types

const LandingSchema = new Schema(
	{
		spotRemaining: { type: Number, default: 125000 },
		totalFragment: { type: Number, default: 0 },
		availableFragment: { type: Number, default: 125000 },
		largestFragment: { type: ObjectId, ref: 'Fragments' },
		noOfMerging: { type: Number, default: 0 },
		payout: {
			type: Number,
			default: 0,
		},
		platformSplit: {
			type: Number,
			default: 20,
		},
		biggestFragmentHolders: {
			type: [],
		},
		mostBoughtAfterPosition: {
			type: [],
		},
		topRankHolders: {
			type: [],
		},
	},
	{
		timestamps: true,
	}
)

const Landing = model('Landing', LandingSchema)

export default Landing
