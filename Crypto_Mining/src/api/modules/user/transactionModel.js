//  @ts-nocheck

import { model, Schema } from 'mongoose'

const TransactionSchema = model(
	'Transaction',
	new Schema(
		{
			_id: { type: String, default: Helper.generateRandomId },

			payment_method: {
				type: String,
				ref: 'PaymentMethod',
				required: true,
			},

			amount: { type: Number, min: 0 },
		},
		{ _id: false, timestamps: true }
	)
)

const Transaction = db.model('Transaction', TransactionSchema)
module.exports.Transaction = Transaction
