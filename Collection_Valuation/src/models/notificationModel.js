const { notificationSettings: { deliveryModesForNotificationTypes } } = require('../config/config')
const Notify = require('../services/delivery');
const logger = require('../common/middlewares/logger');
const mongoose = require('mongoose');
const { Schema } = mongoose;
const db = require('../connection/dbMaster');
const {
  notificationSettings: { deliveryModes, notificationTypes },
} = require('../config/config');

const NotificationSchema = new mongoose.Schema({
  to: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true,
  },
  from: mongoose.Schema.Types.Mixed,
  deliveryModes: [
    { type: String, enum: Object.keys(deliveryModes), required: true },
  ],
  deliveryInfo: {
    email: String,
    sms: String,
    whatsapp: String,
    push: String,
  },
  notificationType: {
    type: String,
    required: true,
    enum: Object.keys(notificationTypes),
  },
  created: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  metadata: {},
});

NotificationSchema.index(
  {
    to: 1,
    notificationType: 1,
    isDeleted: 1,
    isRead: 1,
  },
  { background: true },
);



// Before Save Hook
NotificationSchema.pre('save', async function (next) {
  // Send OTP over email or SMS
  this.deliveryModes = deliveryModesForNotificationTypes[this.notificationType] ?? []
  if (this.isNew) {
    try {
      const result = await Notify(this.toJSON())
      logger.info(
        `${this._id
        } delivered successfully to all provided mediums , result is ${JSON.stringify(
          result,
        )}`,
      );
    } catch (error) {
      logger.error(error);
    }

  }
  next()
})


module.exports = db.model('Notification', NotificationSchema);
