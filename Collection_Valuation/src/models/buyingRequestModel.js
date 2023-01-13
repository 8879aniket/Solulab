const mongoose = require('mongoose');

const { Schema } = mongoose;
const db = require('../connection/dbMaster');

const BuyingRequestSchema = new Schema({
  buyerId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  sellerId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  coinId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  deliveryAddress: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  coinAmount: {
    type: Number,
    required: true,
  },
  deliveryAmount: {
    type: Number,
    required: true,
  },
  deliveryPartnerId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    default: 'pending',
    enum: ['accept', 'pending', 'rejected'],
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  createdAt: { type: Date, default: Date.now },
  modifiedAt: { type: Date, default: Date.now },
});

module.exports = db.model('buyingRequest', BuyingRequestSchema);
