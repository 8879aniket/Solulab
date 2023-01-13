import mongoose from 'mongoose'

const { Schema, model } = mongoose

const roundRewardSchema = new Schema(
	{
		name: {
			type: String,
			default: '',
		},
		round: {
			type: Number,
		},
		maxNftReward: {
			type: mongoose.Decimal128,
		},
		maxOgtReward: {
			type: mongoose.Decimal128,
		},
		nftReward: {
			type: Array,
		},
		ogtReward: {
			type: Array,
		},
	},
	{
		timestamps: true,
	}
)

const roundReward = model('roundReward', roundRewardSchema)

export default roundReward
