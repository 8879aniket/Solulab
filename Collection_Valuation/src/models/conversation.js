const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId
const db = require('../connection/dbMaster');

const schema = new Schema(
  {
    participants: [
      {
        _user: { type: ObjectId, ref: 'users', required: true },
        firstName: { type: String, required: true },
        middleName: String,
        lastName: String,
        unseenCount: { type: Number, required: true },
      },
    ],
    participantsCount: { type: Number, required: true },
    _lastMessage: { type: ObjectId, ref: 'message' },

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

schema.index({
  'participants.firstName': 'text',
  'participants.middleName': 'text',
  'participants.lastName': 'text',
})

// Function to check if any document exits with the given id
schema.static('getById', (value, projection = {}) => {
  return db.models.conversation.findOne({ _id: value }, projection)
})

module.exports = db.model('conversation', schema)
