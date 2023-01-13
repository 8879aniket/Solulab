const mongoose = require('mongoose');

const { Schema } = mongoose;
const db = require('../connection/dbMaster');

const TransactionsSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  walletId: {
    type: Schema.Types.ObjectId,
  },
  transactionId: {
    type: String,
    required: true,
  },
  _order: {
    type: Schema.Types.ObjectId,
    ref: 'orders',
  },
  action: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'created', 'approved', 'cancelled'],
    required: true,
  },
  currency: {
    type: String,
    required: true,
  },
  payUsing: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  transactionMeta: {
    _coin: {
      type: Schema.Types.ObjectId,
      ref: 'coins',
    },
    _order: {
      type: Schema.Types.ObjectId,
      ref: 'orders',
    },
    creditCount: Number,
    paypalToken: String,
    frontURL: String,
  },
  createdAt: { type: Date, default: Date.now },
  modifiedAt: { type: Date, default: Date.now },
});

module.exports = db.model('transaction', TransactionsSchema);
