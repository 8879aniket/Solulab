const mongoose = require('mongoose');
const { Schema } = mongoose;
const db = require('../connection/dbMaster');

const VIPSchema = new Schema({
  creditBonus: {
    type: Number,
  },
  creditValue: {
    type: Number,
  },
  vipPrice: {
    type: Number,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});
module.exports = db.model('vip', VIPSchema);
