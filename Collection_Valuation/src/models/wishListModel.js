const mongoose = require('mongoose');

const { Schema } = mongoose;
const db = require('../connection/dbMaster');

const WishListSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  coinId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  modifiedAt: { type: Date, default: Date.now },
});

module.exports = db.model('wishList', WishListSchema);
