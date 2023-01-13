const mongoose = require('mongoose');

const { Schema } = mongoose;
const db = require('../connection/dbMaster');

const PortfolioSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  coinId: [{
    type: String
  }],
  isPasswordProtected: {
    type: Boolean,
    default: false,
  },
  createdAt: { type: Date, default: Date.now },
  modifiedAt: { type: Date, default: Date.now },
});

module.exports = db.model('portfolio', PortfolioSchema);
