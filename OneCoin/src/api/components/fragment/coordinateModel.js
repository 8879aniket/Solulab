import mongoose from 'mongoose'
import db from '../../connections/dbConnection.js'

const { Schema } = mongoose
const CoordinateSchema = new Schema(
	{
		x: Number,
		y: Number,
		z: Number,
		position: Number,
	},
	{
		timestamps: true,
	}
)

const Coordinate = db.model('Coordinate', CoordinateSchema)

export default Coordinate
