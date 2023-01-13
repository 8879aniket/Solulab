const mongoose = require('mongoose');

const { Schema } = mongoose;
const db = require('../connection/dbMaster');

const MLResponse = new Schema({
  mlMetadata: {
    type: Object,
  },
  type: {
    type: String,
    enum: ['classification', 'grading'],
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  modifiedAt: { type: Date, default: Date.now },
});

module.exports = db.model('MLResponses', MLResponse);
