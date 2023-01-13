import { model, Schema } from 'mongoose'

const PaymentMethodSchema = model(
	'PaymentMethod',
	new Schema(
		{
			_id: { type: String, default: Helper.generateRandomId },

			method: {
				type: String,
				enum: Helper.enumToArrayString(PaymentType),
				required: true,
			},

			card_type: {
				type: String,
				enum: Helper.enumToArrayString(CardType),
				required: true,
			},

			other_card_type: { type: String, trim: true },

			card_number: { type: Number },

			expiry: { type: String, trim: true },

			digital_wallet: {
				type: String,
				enum: Helper.enumToArrayString(DigitalWallet),
				required: true,
			},

			other_digital_wallet: { type: String, trim: true },

			digital_wallet_id: { type: String, trim: true },

			cryto_wallet_id: { type: String, trim: true },

			user: { type: String, ref: 'User', required: true, trim: true },
		},
		{
			_id: false,
			timestamps: true,
		}
	)
)

const PaymentMethod = db.model('PaymentMethod', PaymentMethodSchema)
module.exports.PaymentMethod = PaymentMethod
