const mongoose = require('mongoose');

const { Schema } = mongoose;
const db = require('../connection/dbMaster');

const AuctionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  coinId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  buyerId: {
    type: Schema.Types.ObjectId,
    default: null,
  },
  amount: {
    type: Number,
    required: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  isEnded: {
    type: Boolean,
    default: false,
  },
  isAwarded: {
    type: Boolean,
    default: false,
  },
  startDateTime: { type: String },
  endDateTime: { type: String },
  startDT: { type: Date },
  endDT: { type: Date },
  createdAt: { type: Date, default: Date.now },
  modifiedAt: { type: Date, default: Date.now },
});

module.exports = db.model('auction', AuctionSchema);
