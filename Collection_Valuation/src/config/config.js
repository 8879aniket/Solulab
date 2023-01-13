const moment = require('moment');
require('dotenv').config();
const ENV = process.env.NODE_ENV ?? 'development';

module.exports = {
  db: {
    // str: 'mongodb+srv://collection-valuation:collection-valuation@collection-valuation.wrwlv.mongodb.net/collection-valuation',
    str:
      ENV === 'development' ? process.env.DEV_MONGO_URL : process.env.MONGO_URL,
    options: {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
    },
  },
  generateOtpExpiry: () =>
    moment().add(parseInt(process.env.OTP_VALIDITY_IN_MINUTES), 'm')._d,
  appSecret: process.env.APP_SECRET,
  emailSettings: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'collectionscanner360@gmail.com',
      pass: 'collection_360',
    },
    from: {
      email: 'collectionscanner360@gmail.com',
      name: 'collection-valuation',
    },
  },
  twilio: {
    accountSid: 'AC6a9a658fa9077a651c547101c592a4ea',
    authToken: 'a7a8e40cf0872b181546b8974e26f67a',
    fromNumber: '+19094350301',
  },
  notificationSettings: {
    deliveryModes: {
      email: 'email',
      sms: 'sms',
      whatsapp: 'whatsapp',
      push: 'push',
    },
    notificationTypes: {
      USER_REGISTERED: 'USER_REGISTERED',
      CHANGE_PASSWORD: 'CHANGE_PASSWORD',
      RESET_PASSWORD: 'RESET_PASSWORD',
      RESEND_OTP: 'RESEND_OTP',
      RESEND_MAIL: 'RESEND_MAIL',
      BID_RECEIVED: 'BID_RECEIVED',
      COIN_AWARDED: 'COIN_AWARDED',
      KYC_REQUESTED: 'KYC_REQUESTED',
      KYC_VERIFIED: 'KYC_VERIFIED',
      ORDER_PLACED: 'ORDER_PLACED',
      PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
      VIP_MEMBERSHIP_ACQUIRED: 'VIP_MEMBERSHIP_ACQUIRED',
    },
    deliveryModesForNotificationTypes: {
      USER_REGISTERED: ['email', 'sms'],
      CHANGE_PASSWORD: ['email', 'sms', 'push'],
      RESET_PASSWORD: ['email', 'sms'],
      RESEND_OTP: ['email', 'sms'],
      RESEND_MAIL: ['email', 'sms'],
      BID_RECEIVED: ['email', 'sms'],
      COIN_AWARDED: ['email', 'sms'],
      KYC_REQUESTED: ['email', 'sms'],
      KYC_VERIFIED: ['email', 'sms'],
      ORDER_PLACED: ['email', 'sms'],
      PAYMENT_RECEIVED: ['email', 'sms'],
      VIP_MEMBERSHIP_ACQUIRED: ['email', 'sms'],
    },
  },
  getCurrentDateTime: () => moment().toDate(),
  emailVerificationCodeValidity: 60,
  // ACCESSURL: 'http://localhost:3000/',
  ACCESSURL:
    ENV === 'development' ? process.env.LOCAL_ACCESSURL : process.env.ACCESSURL,
  trulioo: {
    apiKey: '9f10787b7e76b0554a7306331a4a30a9',
    url: 'https://gateway.trulioo.com/trial',
    mode: 'trial',
    configurationName: 'Identity Verification',
  },
  S3: {
    ACCESSKEYID: 'AKIA3UV64NPUVTHUS5FL',
    SECRETACCESSKEY: '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',
    ACL: 'public-read',
    BUCKET_NAME: 'collection-valuation',
  },
  PYTHON: {
    COIN_CLASSIFICATION_COMMAND: process.env.COIN_CLASSIFICATION_COMMAND,
    COIN_GRADING_COMMAND: process.env.COIN_GRADING_COMMAND,
  },
  PYTHON: {
    COIN_CLASSIFICATION_COMMAND: process.env.COIN_CLASSIFICATION_COMMAND,
    COIN_GRADING_COMMAND: process.env.COIN_GRADING_COMMAND,
  },
  PAYPAL: {
    PAYPAL_KEY: process.env.PAYPAL_ID,
    PAYPAL_SECRET: process.env.PAYPAL_SECRET,
    PAYPAL_MODE: process.env.PAYPAL_MODE,
    PAYPAL_WEBHOOK_URL: process.env.PAYPAL_WEBHOOK_URL,
  },
};
