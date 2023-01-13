const mongoose = require('mongoose');

const { Schema } = mongoose;
const db = require('../connection/dbMaster');

const RatingSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  sellerId: {
    type: Schema.Types.ObjectId,
    required: true,
  }, 
  review: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },  
  isDeleted: {
    type: Boolean,
    default: false,
  },
  createdAt: { type: Date, default: Date.now },
  modifiedAt: { type: Date, default: Date.now },
});

module.exports = db.model('rating', RatingSchema);
