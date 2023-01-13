const mongoose = require('mongoose');

const { Schema } = mongoose;
const db = require('../connection/dbMaster');

const WalletSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  amount: {
    type: Schema.Types.Decimal128,
    default: 0,
  },
  currency: {
    type: String,
    default: 'usd',
  },
  created: { type: Date, default: Date.now },
});

WalletSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.amount = ret.amount.toString();
    return ret;
  },
});

module.exports = db.model('wallet', WalletSchema);
