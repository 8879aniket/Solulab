import mongoose from 'mongoose'
import db from '../../connections/db'

const ticketSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.ObjectId },
	ticketId: { type: String, require: true },
	createdAt: { type: Date },
})

const ticket = db.model('Ticket', ticketSchema)

export default ticket
