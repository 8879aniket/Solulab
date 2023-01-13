const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId
const db = require('../connection/dbMaster');

const schema = new Schema(
  {
    _conversation: { type: ObjectId, required: true },
    _messagedBy: { type: ObjectId, required: true },
    _readBy: { type: [ObjectId], required: true },
    message: { type: String, required: true },

    // From Base Model
    isActive: { type: Boolean, default: true },
    _createdBy: { type: ObjectId, ref: 'users', select: false },
    _updatedBy: { type: ObjectId, ref: 'users', select: false },
  },
  {
    autoIndex: true,
    versionKey: false,
    timestamps: true,
  }
)


// Function to check if any document exits with the given id
schema.static('getById', (value, projection = {}) => {
  return db.models.message.findOne({ _id: value }, projection)
})

module.exports = db.model('message', schema)
