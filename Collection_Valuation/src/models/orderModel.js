const mongoose = require('mongoose');

const { Schema } = mongoose;

mongoose.Promise = Promise;

const db = require('../connection/dbMaster');

const OrderSchema = new Schema({
  _buyer: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'users',
  },
  _seller: {
    type: Schema.Types.ObjectId,
    ref: 'users',
  },
  _coin: {
    type: Schema.Types.ObjectId,
    ref: 'coins',
  },
  _transaction: {
    type: Schema.Types.ObjectId,
    ref: 'transactions',
  },
  status: {
    type: String,
    enum: [
      'placed',
      'confirmed',
      'paymentInProgress',
      'inTransit',
      'delivered',
      'cancelled',
      'failed',
    ],
    default: 'placed',
  },
  orderType: {
    type: String,
    enum: ['coinSale', 'addCredit', 'buyVipMembership', 'coinGrading'],
    default: 'coinSale',
  },
  trackMeta: {
    trackId: {
      type: String,
    },
    website: {
      type: String,
    },
    name: {
      type: String,
    },
    comments: {
      type: String,
    },
  },
  orderMeta: {
    _coin: {
      type: Schema.Types.ObjectId,
      ref: 'coins',
    },
    creditCount: Number,
  },
  deliveryAddress: { type: String },
  shipping_address: {
    address_line: {
      type: String,
    },
    address_line_1: {
      type: String,
    },
    pincode: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    country: {
      type: String,
    },
  },
  isShipped: { type: Boolean, default: false },
  rating: {
    rate: {
      type: Number,
    },
    review: {
      type: String,
    },
  },
  createdAt: { type: Date, default: Date.now },
  modifiedAt: { type: Date, default: Date.now },
});

module.exports = db.model('orders', OrderSchema);
