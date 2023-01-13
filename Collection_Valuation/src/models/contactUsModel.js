const mongoose = require('mongoose');

const { Schema } = mongoose;
const db = require('../connection/dbMaster');

const contactUsSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  modifiedAt: { type: Date, default: Date.now },
  isApproved: { type: Boolean, default: false }
});

module.exports = db.model('contactUs', contactUsSchema);
