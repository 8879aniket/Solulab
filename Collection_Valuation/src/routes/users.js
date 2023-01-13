const express = require('express');
const router = express.Router();

const { validate } = require('express-jsonschema');
const { isAuthenticated } = require('../common/middlewares/authCheck');
const {
  signUp,
  loginValidation,
  forgotPwd,
  otpVerifyDTO,
  resetPasswordDTO,
} = require('../common/utils/userValidations');
// router.use(isAuthenticated);
const { uploadS3 } = require('../helpers/s3.helper');

const {
  register,
  login,
  forgotPassword,
  update,
  uploadProfilePic,
  otpVerify,
  changePassword,
  resetPassword,
  checkUserNameExist,
  addRateingReview,
  getTruliooConsents,
  getTruliooCountryCodes,
  postUserKyc,
  resendOTP,
  resendEmail,
  postAddress,
  editAddress,
  deleteAddress,
  logout,
  getCountry,
  getUserDetails,
  getUserAddress,
  changePrimaryAddress,
  InitPaymentForBecomeVIPMember: _InitPaymentForBecomeVIPMember,
  CheckAvailability: _CheckAvailability,
  GetAllNotification: _GetAllNotification,
  uploadKyc,
  updateKycStatus,
  resetVIPMember,
  getWalletDetails,
  getUserTransectionDetails,
  getTransectionDetails,
  userDataService,
} = require('../controller/users');

// User
router.get('/login', login);
router.post('/register', validate({ body: signUp }), register);
router.get('/register/check-availability', _CheckAvailability);
router.post('/login', validate({ body: loginValidation }), login);
router.post('/forgot-password', validate({ body: forgotPwd }), forgotPassword);
router.post('/resend-otp', resendOTP);
router.post('/resend-email', resendEmail);
router.put('/', update);
router.put('/update/profile-pic', uploadS3.array('file'), uploadProfilePic);
router.get('/details/:userId', getUserDetails);
router.post('/otp-verify', validate({ body: otpVerifyDTO }), otpVerify);
router.post('/change-password', changePassword);
router.post(
  '/reset-password',
  validate({ body: resetPasswordDTO }),
  resetPassword
);
router.get('/check-username', checkUserNameExist);
router.post('/review-rating', addRateingReview);
router.get('/trulioo-consents', getTruliooConsents);
router.get('/trulioo-country-codes', getTruliooCountryCodes);
router.post('/trulioo-post-kyc', postUserKyc);
router.post('/post-address', postAddress);
router.put('/edit-address', editAddress);
router.delete('/delete-address/:addressId', deleteAddress);
router.put('/logout', logout);
router.get('/countries', getCountry);
router.get('/get-address', getUserAddress);
router.put('/change-primary-address/:addressId', changePrimaryAddress);
router.get('/notifications', _GetAllNotification);
router.post(
  '/upload-kyc',
  isAuthenticated,
  uploadS3.fields([
    { name: 'documentOne', maxCount: 1 },
    { name: 'documentTwo', maxCount: 1 },
    { name: 'documentThree', maxCount: 1 },
  ]),
  uploadKyc
);
router.post('/update-kyc-status', updateKycStatus);
router.put('/resetVIPMember', resetVIPMember);
router.get('/getWalletDetails', getWalletDetails);
router.get('/getTransectionDetails', getUserTransectionDetails);
router.get('/getTransectionById', getTransectionDetails);
router.get('/data/:userId', userDataService);

module.exports = router;
