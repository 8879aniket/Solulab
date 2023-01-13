import mongoose from 'mongoose'

const { Schema, model } = mongoose
const { ObjectId } = Schema.Types

const SoughtReqSchema = new Schema(
	{
		x: { type: Number, required: true },
		y: { type: Number, default: true },
		z: { type: Number, default: true },
		createdBy: { type: ObjectId, ref: 'User' },
	},
	{
		timestamps: true,
	}
)

const SoughtReq = model('SoughtReq', SoughtReqSchema)

export default SoughtReq
