const mongoose = require('mongoose');

const { Schema } = mongoose;

mongoose.Promise = Promise;

const bcrypt = require('bcrypt');

const db = require('../connection/dbMaster');
const defaultSchema = require('../common/plugins/defaultSchemaAttr');
const addressSchema = new Schema({
  addressLine1: String,
  addressLine2: String,
  addressLine3: String,
  phone: String,
  email: String,

  city: {
    type: String,
    default: '',
  },
  country: String,
  postalCode: String,
  name: String,
  isPrimary: { type: Boolean, default: false },
});
const sellerRating = new Schema({
  rate: {
    type: Number,
  },
  review: {
    type: String,
  },
  _buyer: Schema.Types.ObjectId,
  _order: Schema.Types.ObjectId,
});

// Define our user schema
const UserSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  userName: { type: String, required: true },
  creditCount: { type: Number, default: 0 },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    required: true,
  },
  countryCode: { type: String, required: true },
  phone: {
    type: String,
    index: true,
    required: true,
  },
  tmpPhone: { type: String },
  password: {
    type: String,
    select: false,
  },
  isBlocked: { type: Boolean, default: false },
  gender: { type: String, required: true, enum: ['female', 'male', 'other'] },
  dob: { type: String, required: true },
  profilePic: {
    key: String,
    url: String,
    sizeInMegaByte: Number,
  },
  isPhoneVerified: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  country: { type: String, default: '' },
  city: { type: String, default: '' },
  address: [addressSchema],
  isVIPMemeber: { type: Boolean, default: false },
  vipMemberStartDate: { type: Date },
  vipMemberEndDate: { type: Date },
  // isKycVerified: { type: Boolean, default: false },
  kyc: {
    status: {
      type: Boolean,
      default: false,
    },
    isKyc: {
      type: String,
      enum: ['notVerified', 'pending', 'reject', 'verified', 'suspend'],
      default: 'notVerified',
    },
    kycRejectReason: {
      type: String,
      default: 'null',
    },
  },
  kycUploadAddressProof: {
    status: {
      type: Boolean,
      default: false,
    },
    isKyc: {
      type: String,
      enum: ['notVerified', 'pending', 'reject', 'verified'],
      default: 'notVerified',
    },
    kycRejectReason: {
      type: String,
      default: 'null',
    },
  },
  kycUploadIdProof: {
    status: {
      type: Boolean,
      default: false,
    },
    isKyc: {
      type: String,
      enum: ['notVerified', 'pending', 'reject', 'verified'],
      default: 'notVerified',
    },
    kycRejectReason: {
      type: String,
      default: 'null',
    },
  },
  KycUploadWithSelfiePhoto: {
    status: {
      type: Boolean,
      default: false,
    },
    isKyc: {
      type: String,
      enum: ['notVerified', 'pending', 'reject', 'verified'],
      default: 'notVerified',
    },
    kycRejectReason: {
      type: String,
      default: 'null',
    },
  },
  kycDetails: {
    chooseId: String,
    kycIdProof: { type: String, default: null },
    chooseAddressId: String,
    KycAddressProof: { type: String, default: null },
    KycPhotoId: { type: String, default: null },
  },
  kycDocument: {
    type: Object,
  },
  isReported: { type: Boolean, default: false },
  wishlist: [{ type: Schema.Types.ObjectId, ref: 'coins' }],

  // "referenceToken" is just to identify the user once the OTP verification is done
  referenceToken: String,
  otp: { type: String /* select: false */ },
  otpExpiry: { type: Date },
  fcmToken: { type: String },
  token: {
    type: String,
    default: '',
    select: false,
  },
  link: {
    type: String,
    default: '',
    select: false,
  },
  deviceType: {
    type: String,
    enum: ['android', 'ios'],
  },
  loginType: {
    type: String,
    enum: ['manual', 'google', 'facebook', 'twitter'],
  },
  socialId: {
    type: String,
  },
  rating: {
    type: Number,
    default: 0,
  },
  review: [
    {
      text: {
        type: String,
      },
      userId: {
        type: Schema.Types.ObjectId,
      },
    },
  ],
  sellerReview: [sellerRating],
});

UserSchema.pre('save', async function preSave(cb) {
  try {
    if (this.isModified('password')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
    cb();
  } catch (error) {
    cb(error);
  }
});

UserSchema.methods.encryptPassword = function encryptPassword(password) {
  return bcrypt.hashSync(password, 10);
};

UserSchema.methods.verifyPassword = function verifyPassword(password) {
  return bcrypt.compare(password, this.password);
};

UserSchema.plugin(defaultSchema);
UserSchema.index({ country: 'hashed' }, { background: true });

// Function to check if any document exits with the given id
UserSchema.static('getById', (value, projection = {}) => {
  return db.models.users.findOne({ _id: value }, projection);
});

module.exports = db.model('users', UserSchema);
