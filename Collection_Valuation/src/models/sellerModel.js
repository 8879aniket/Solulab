const mongoose = require('mongoose');

const { Schema } = mongoose;
const db = require('../connection/dbMaster');

const SellerSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  portfolioId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  coinId: [{
    type: String
  }],
  scanInfo: [{
    type: String,
  }],
  rating: {
    rate: {
      type: Number
    },
    review: {
      type: String
    }
  },
  created: { type: Date, default: Date.now },
});

module.exports = db.model('sellers', SellerSchema);
