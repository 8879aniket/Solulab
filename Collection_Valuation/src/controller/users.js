const jwt = require('jsonwebtoken');
const _ = require('lodash');
const formidable = require('formidable');

require('dotenv').config();

const { S3ExtractMeta, deleteFromS3 } = require('../helpers/s3.helper');
const {
  SocialTokenValidator,
} = require('../helpers/social-token-validator.helper');
const { PayPalHelper } = require('../helpers/paypal.helper');

const {
  handleResponse,
  handleError,
} = require('../common/middlewares/requestHandlers');

const s3UploadHelper = require('../common/middlewares/s3UploadHelper');
const compressImageHelper = require('../common/middlewares/compressImageHelper');
const s3DeleteHelper = require('../common/middlewares/s3DeleteHelper');

const { generateRandonCode } = require('../common/utils/util');

const {
  generateOtpExpiry,
  appSecret,
  notificationSettings: {
    notificationTypes,
    deliveryModesForNotificationTypes,
  },
} = require('../config/config');

const {
  save,
  get,
  getWithMultipleFields,
  update,
  getOtpByPhone,
  updatePassword,
  chkLink,
  getSocialUser,
  getUserName,
  addRateingReview,
  addAddress,
  updateAddress,
  removeAddress,
  getCountries,
  changePrimaryAddress,
  verifyPhone,
  verifyEmail: _VerifyEmail,
  verifyOTPForForgotPassword: _VerifyOTPForForgotPassword,
  uploadKycDocument,
  updateKycStatus,
  resetVIPMember,
  getWalletDetails,
  getUserTransectionDetails,
  getTransectionDetails,
  userDataService,
} = require('../dbServices/users');

const User = require('../models/userModel');

const { save: saveNotification } = require('../dbServices/notification');
const NotificationService = require('../dbServices/notification');

const { getConsents, getCountryCodes } = require('../dbServices/trulioo');

const {
  requiredFeilds,
  passChk,
  chkUserExist,
  phoneNotAvailable,
  emailRequired,
  userNameRequired,
  chkValidPhone,
  chkValidEmail,
  verification,
  missingBodyParameter,
  ValidFileRequired,
  requiredPhoneOrEmail,
  requiredPassword,
} = require('../messages/error');

const {
  verifyCodeForgotPwd,
  reviewAdded,
  primaryAddress,
  verifyEmail,
} = require('../messages/success');

const generateJwtToken = async (user) => {
  const token = await jwt.sign(user._doc || user, appSecret, {});
  return token;
};

module.exports.register = async ({ body }, res) => {
  try {
    const {
      phone,
      email,
      userName,
      firstName,
      lastName,
      loginType,
      countryCode,
      socialAccessToken,
    } = body;

    if (loginType != 'manual' && !socialAccessToken) {
      throw socialIdRequired;
    }

    const existingUserPhone = await get(phone, 'phone');
    if (existingUserPhone) {
      throw phoneNotAvailable;
    }

    const existingUserEmail = await get(email, 'email');
    if (existingUserEmail) {
      throw emailRequired;
    }

    const existingUserName = await get(userName, 'userName');
    if (existingUserName) {
      throw userNameRequired;
    }

    if (loginType === 'manual') {
      const user = await save(body);

      delete user.password;
      const newToken = await generateJwtToken(user);
      const link = await generateRandonCode(10);
      const otpCode = await Math.floor(100000 + Math.random() * 900000);
      user.token = newToken;
      user.otp = otpCode;
      user.otpExpiry = generateOtpExpiry();
      user.link = link;

      // Save User
      await user.save();

      await saveNotification({
        notificationType: notificationTypes.USER_REGISTERED,
        to: user._id,
        metadata: {
          body: `Your verification code is : ${otpCode}`,
          firstName,
          lastName,
          link,
        },
        deliveryInfo: {
          sms: countryCode + phone,
          email,
        },
      });

      return handleResponse({ res, data: user });
    } else {
      const getSocialUserAccount = await SocialTokenValidator.Validate(
        loginType,
        socialAccessToken
      );

      // Abort if getSocialUserAccount is null. [means invalid socialAccessToken]
      if (!getSocialUserAccount) {
        return handleResponse({
          res,
          statusCode: 401,
          data: { SOCIAL_NOT_REGISTERED: true },
          msg: 'Invalid Social credentials',
        });
      }

      let socialUser = await save({
        ...body,
        socialId: getSocialUserAccount.id,
        email: getSocialUserAccount.email
          ? getSocialUserAccount.email
          : body.email,
      });

      delete socialUser.password;
      const newToken = await generateJwtToken(socialUser);
      socialUser = await update(
        socialUser._id,
        {
          token: newToken,
        },
        '+token'
      );
      return handleResponse({
        res,
        msg: 'Sign Up successful',
        data: socialUser,
      });
    }
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.login = async (
  { body: { email, phone, password, loginType, socialAccessToken } },
  res
) => {
  try {
    if (loginType == 'manual') {
      if (!phone && !email)
        return handleError({
          res,
          err: requiredPhoneOrEmail,
          data: { type: 'phone_or_mail' },
        });
      if (!password)
        return handleError({
          res,
          err: requiredPassword,
          data: { type: 'password' },
        });
      const bodyString = phone !== undefined ? 'phone' : 'email';
      const body = phone !== undefined ? phone : email;
      const msgString = phone !== undefined ? 'Phone number' : 'Email';
      let user = await get(body, bodyString, 'password otp phone countryCode');
      if (!user) {
        return handleError({
          res,
          err: `${msgString} entered is incorrect.`,
          data: { type: 'phone_or_mail' },
        });
      }
      if (!user.password || !(await user.verifyPassword(password))) {
        return handleError({ res, err: passChk, data: { type: 'password' } });
      }
      delete user._doc.password;
      const withoutToken = { ...user._doc };
      delete withoutToken.token;
      user = await get(user._id);
      // if (!user.isEmailVerified && !user.isPhoneVerified) {
      //   handleResponse({ res, msg: `Email & phone are ${verification}`, data: withoutToken });
      // } else if (!user.isEmailVerified) {
      //   handleResponse({ res, msg: `Email is ${verification}`, data: withoutToken });
      // } else
      if (!user.isPhoneVerified) {
        handleResponse({
          res,
          msg: `phone is ${verification}`,
          data: withoutToken,
        });
      } else {
        if (user.isDeleted) throw chkUserExist;
        const newToken = await generateJwtToken(withoutToken);
        user = await update(user._id, { token: newToken }, '+token');
        handleResponse({ res, data: user });
      }
    } else {
      const getSocialUserAccount = await SocialTokenValidator.Validate(
        loginType,
        socialAccessToken
      );

      // Abort if getSocialUserAccount is null. [means invalid socialAccessToken]
      if (!getSocialUserAccount) {
        return handleResponse({
          res,
          statusCode: 401,
          data: { SOCIAL_NOT_REGISTERED: true },
          msg: 'Invalid Social login',
        });
      }

      /**
       * Step 1:
       *  Try the find the user with email returned by the Social OAuth Provider.
       * Step 2:
       *  If the OAuth Provided is not returning the email for some security reasons,
       *  then try to find the user with the returned "SocialId"
       */
      let socialUser = null;
      if (getSocialUserAccount.email) {
        socialUser = await get(getSocialUserAccount.email, 'email');
      } else {
        socialUser = await get(getSocialUserAccount.id, 'socialId');
      }

      // let socialUser = await getSocialUser(loginType, socialAccessToken, email);
      if (!socialUser) {
        return handleResponse({
          res,
          statusCode: 200,
          data: { SOCIAL_NOT_REGISTERED: true },
          msg: 'Social login not registered',
        });
      }
      delete socialUser.password;
      const socialUserData = { ...socialUser._doc };
      delete socialUserData.token;
      const newToken = await generateJwtToken(socialUserData);
      user = await update(
        socialUserData._id,
        {
          socialId: getSocialUserAccount.id,
          token: newToken,
        },
        '+token'
      );
      return handleResponse({
        res,
        msg: 'Login successfully',
        data: user,
      });
    }
  } catch (err) {
    handleError({ res, err });
  }
};

module.exports.forgotPassword = async (req, res) => {
  const { phone, countryCode, email } = req.body;
  try {
    if ((!phone || !countryCode) && !email)
      return handleResponse({ result: 0, res, msg: missingBodyParameter });
    let user;
    if (phone) user = await getWithMultipleFields({ phone, countryCode });
    else user = await getWithMultipleFields({ email });
    if (user) {
      delete user._doc.password;
      delete user._doc.token;
      //if (user.isPhoneVerified === true) {
      const otpCode = await Math.floor(100000 + Math.random() * 900000);
      user = await update(user._id, {
        otp: otpCode,
        otpExpiry: generateOtpExpiry(),
      });
      await saveNotification({
        notificationType: notificationTypes.RESET_PASSWORD,
        to: user._id,
        metadata: {
          body: `Your code is : ${otpCode}`,
        },
        deliveryInfo: {
          sms: user.countryCode + user.phone,
        },
      });

      return handleResponse({ res, msg: verifyCodeForgotPwd });
    }
    return handleResponse({
      result: 0,
      res,
      msg: email ? chkValidEmail : chkValidPhone,
    });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.resendOTP = async (req, res) => {
  const { phone } = req.body;
  try {
    if (!phone)
      return handleResponse({ result: 0, res, msg: missingBodyParameter });
    let user;
    if (phone) user = await get(phone, 'phone');
    if (user) {
      delete user._doc.password;
      delete user._doc.token;
      const otpCode = await Math.floor(100000 + Math.random() * 900000);
      user = await update(user._id, {
        otp: otpCode,
        otpExpiry: generateOtpExpiry(),
      });
      await saveNotification({
        notificationType: notificationTypes.RESEND_OTP,
        to: user._id,
        metadata: {
          body: `Your verification code is : ${otpCode}`,
        },
        deliveryInfo: {
          sms: user.countryCode + user.phone,
        },
      });
      return handleResponse({ res, msg: verifyCodeForgotPwd, data: user });
    }
    return handleResponse({
      result: 0,
      res,
      msg: chkValidPhone,
      data: user,
    });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.resendEmail = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email)
      return handleResponse({ result: 0, res, msg: missingBodyParameter });
    let user;
    if (email) user = await get(email, 'email');
    if (user) {
      const link = await generateRandonCode(10);
      delete user._doc.password;
      delete user._doc.token;
      user = await update(user._id, {
        link,
      });
      await saveNotification({
        notificationType: notificationTypes.RESEND_MAIL,
        to: user._id,
        metadata: {
          firstName: user.firstName,
          lastName: user.lastName,
          link,
        },
        deliveryInfo: {
          email,
        },
      });
      return handleResponse({ res, msg: verifyEmail });
    }
    return handleResponse({
      result: 0,
      res,
      msg: chkValidEmail,
      data: user,
    });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.update = async (
  { user: { _id: userId, countryCode }, body },
  res
) => {
  try {
    // if (body.phone) {
    //   const user = await get(body.phone, 'phone');
    //   if (user) throw phoneNotAvailable;
    //   body.tmpPhone = body.phone;
    //   body.phone = false;
    //   const otpCode = await Math.floor(100000 + Math.random() * 900000);
    //   body.otp = otpCode;
    //   body.otpExpiry = generateOtpExpiry();
    // }

    const data = await update(userId, body);
    handleResponse({
      res,
      mgs: 'Profile information updated successfully.',
      data: data,
    });
  } catch (err) {
    handleError({ res, err });
  }
};

module.exports.uploadProfilePic = async (req, res) => {
  try {
    const { user: __user } = req;

    // Fetch uploaded file information
    const { files } = req;
    if (!files) {
      return handleError({
        statusCode: 422,
        res,
        err: 'Please upload one image file. -1',
      });
    }

    const FILE = S3ExtractMeta(files);
    if (FILE.length !== 1) {
      return handleError({
        statusCode: 422,
        res,
        err: 'Please upload one image file.',
      });
    }

    const targetFile = FILE[0];

    // Throw error if uploaded file is not an image
    if (targetFile.contentType != 'image') {
      // Remove the uploaded File
      await deleteFromS3(targetFile.key);
      return handleError({
        statusCode: 422,
        res,
        err: 'Please upload one image file.',
      });
    }

    // Fetch user
    const user = await get(req.user._id);
    let oldProfilePic = user.toJSON().profilePic;
    oldProfilePic = _.isString(oldProfilePic) ? null : oldProfilePic;

    // Remove old profile picture
    if (oldProfilePic) {
      await deleteFromS3(oldProfilePic.key);
    }

    // Add New image information
    user.profilePic = {
      key: targetFile.key,
      url: targetFile.location,
      sizeInMegaByte: targetFile.size / 1024 ** 2,
    };

    // Save User
    await user.save();

    // All Done
    handleResponse({
      res,
      mgs: 'Profile picture updated successfully.',
      data: user,
    });
  } catch (err) {
    handleError({ res, err });
  }
};

module.exports.otpVerify = async (req, res) => {
  let { countryCode } = req.body;
  const { phone, otp, email, type = 'verifyPhone' } = req.body;
  try {
    if (!phone && !email) {
      return handleError({
        res,
        statusCode: 422,
        err: 'Please provide email or phone.',
      });
    }

    /**
     * Find the user with email or with phone and countryCode.
     */
    let user = null;
    let query = {
      otp,
      otpExpiry: { $gte: new Date().toISOString() },
    };
    if (email) {
      query.email = email;
    } else {
      // if (!countryCode) {
      //   return handleError({
      //     res,
      //     statusCode: 422,
      //     err: "Please provide countryCode."
      //   });
      // }
      query.phone = phone;
      if (countryCode && countryCode != '') {
        query.countryCode = countryCode;
      }
    }

    // Abort if no user found.
    user = await getWithMultipleFields(query);
    if (!user) {
      return handleError({
        err: 'Invalid or Expired OTP.',
        statusCode: 403,
        res,
      });
    }
    countryCode = user.countryCode;
    let referenceToken = undefined;
    switch (type) {
      case 'verifyPhone':
        await verifyPhone(countryCode, phone, otp);
        break;
      case 'verifyEmail':
        await _VerifyEmail(email, otp);
        break;
      case 'forgotPassword':
        const { referenceToken: _ReferenceToken } =
          await _VerifyOTPForForgotPassword({
            _user: user._id,
            otp,
          });
        referenceToken = _ReferenceToken;
        break;
    }

    // All Done
    return handleResponse({
      res,
      msg: 'OTP verified successfully.',
      data: {
        referenceToken,
      },
    });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.resetPassword = async (req, res) => {
  const { referenceToken: _referenceToken, newPassword } = req.body;
  try {
    const referenceToken = Buffer.from(_referenceToken, 'base64').toString(
      'ascii'
    );
    const user = await getWithMultipleFields({ referenceToken }, '+password');
    if (!user) {
      return handleError({ res, err: `Invalid user.`, statusCode: 422 });
    }

    if (user.password && (await user.verifyPassword(newPassword))) {
      return handleError({
        res,
        err: 'You cannot use your old password.',
        statusCode: 403,
      });
    }

    user.password = newPassword;
    user.referenceToken = undefined;
    await user.save();

    // Send Notification
    await saveNotification({
      notificationType: notificationTypes.RESET_PASSWORD,
      to: user._id,
      metadata: {
        body: `Your password has been reset successfully.`,
      },
      deliveryInfo: {
        email: user.email,
        sms: user.countryCode + user.phone,
      },
    });

    // All Done
    return handleResponse({
      res,
      msg: 'Password changed successfully.',
    });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.changePassword = async (req, res) => {
  const {
    countryCode,
    phone,
    oldPassword,
    newPassword: password,
    email,
  } = req.body;
  try {
    if ((!phone || !countryCode) && !email)
      return handleResponse({
        res,
        msg: 'Please provide either Phone Number or Email',
      });

    if (!password)
      return handleResponse({
        res,
        msg: 'Please provide new password.',
      });
    let query;
    if (!email) query = { phone, countryCode };
    else query = { email };
    const user = await getWithMultipleFields(query, '+password');
    if (!user) {
      return handleError({
        res,
        err: `Invalid ${email ? 'Email' : 'Phone Number'}.`,
        statusCode: 422,
      });
    }

    /**
     * CASE 1:
     * So if the user.password exists then oldPassword is mandatory
     *
     * CASE 2:
     * In case of social signup user won't be having the password. But will definitely have social id.
     * So if the user.password does not exists but user.socialId exists, then oldPassword is not mandatory
     */
    if (user.password) {
      /**
       * CASE 1:
       */
      if (!oldPassword) {
        return handleResponse({
          res,
          msg: 'Please provide old password and new password.',
        });
      }

      if (!(await user.verifyPassword(oldPassword))) {
        return handleError({
          res,
          err: 'Your current password is incorrect.',
          statusCode: 403,
        });
      }

      if (await user.verifyPassword(password)) {
        return handleError({
          res,
          err: 'You cannot use your old password.',
          statusCode: 403,
        });
      }
    } else {
      /**
       * CASE 2:
       */
      user.socialId = user.socialId == '' ? null : user.socialId;
      if (!user.socialId) {
        return handleError({
          res,
          err: 'Your current password is incorrect.',
          statusCode: 403,
        });
      }
    }

    let userUpdateStatus = await updatePassword(
      countryCode,
      phone,
      password,
      email
    );

    // Send Notification
    await saveNotification({
      notificationType: notificationTypes.CHANGE_PASSWORD,
      to: user._id,
      metadata: {
        body: `Your password has been changed successfully. `,
      },
      deliveryInfo: {
        email: user.email,
        sms: user.countryCode + user.phone,
        push: user.fcmToken,
      },
    });

    if (userUpdateStatus) {
      return handleResponse({
        res,
        msg: 'Password changed successfully.',
      });
    }
    return handleResponse({
      res,
      msg: 'Something went wrong.',
    });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.verifyEmail = async ({ params: { link }, res }) => {
  try {
    if (!link) {
      handleResponse({ res, msg: 'Invalid Link' });
    }
    const data = await chkLink(link);
    if (data != null) {
      handleResponse({ res, data });
    } else {
      handleResponse({ res, msg: 'Invalid Link' });
    }
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.checkUserNameExist = async (req, res) => {
  let { userName } = req.query;
  try {
    if (!userName)
      return handleResponse({
        res,
        msg: 'please provide an userName',
      });
    userName = userName.toLowerCase();
    let user = await get(userName, 'userName');

    if (user) {
      return handleResponse({
        res,
        msg: 'userName already exist',
        data: [],
      });
    }
    return handleResponse({
      res,
      msg: 'userName not available',
      data: [],
    });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.addRateingReview = async (
  { user: { _id }, body: { rating, review, previousRating } },
  res
) => {
  try {
    const data = await addRateingReview(rating, review, previousRating, _id);
    return handleResponse({ res, msg: reviewAdded, data });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.getTruliooConsents = async (req, res) => {
  try {
    const data = await getConsents();
    return handleResponse({ res, msg: 'success', data });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.getTruliooCountryCodes = async (req, res) => {
  try {
    const data = await getCountryCodes();
    return handleResponse({ res, msg: 'success', data });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.postUserKyc = async (req, res) => {
  try {
    const data = await postKyc();
    return handleResponse({ res, msg: 'success', data });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.postAddress = async (req, res) => {
  try {
    let addressData = req.body;
    const userData = await get(req.user._id);
    if (userData) {
      const address = userData.address;
      if (address.length == 0) {
        addressData.isPrimary = true;
      }
    }
    const addressDoc = await addAddress(req.user._id, addressData);
    if (addressDoc) {
      return handleResponse({ res, msg: 'success', data: addressDoc.address });
    }
    return handleResponse({
      res,
      msg: 'Address could not be added',
      result: 0,
    });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.editAddress = async (req, res) => {
  try {
    let addressData = req.body;
    const addressDoc = await updateAddress(req.user._id, addressData);
    if (addressDoc) {
      return handleResponse({ res, msg: 'success', data: addressDoc.address });
    }
    return handleResponse({
      res,
      msg: 'Address could not be updated',
      result: 0,
    });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.deleteAddress = async (req, res) => {
  try {
    let addressId = req.params.addressId;
    const deleteAddressDoc = await removeAddress(req.user._id, addressId);
    if (deleteAddressDoc) {
      return handleResponse({
        res,
        msg: 'Address deleted successfully.',
        data: deleteAddressDoc.address,
      });
    }
    return handleResponse({
      res,
      msg: 'address could not be deleted',
      result: 0,
    });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.logout = async ({ user: { _id } }, res) => {
  try {
    await logout(_id);
    handleResponse({ res });
  } catch (err) {
    handleError({ res, err });
  }
};

module.exports.getCountry = async (req, res) => {
  try {
    const con = await getCountries();
    handleResponse({ res, data: con });
  } catch (err) {
    handleError({ res, err });
  }
};

module.exports.getUserDetails = async ({ params: { userId } }, res) => {
  try {
    const userData = await get(userId);
    handleResponse({ res, data: userData });
  } catch (err) {
    handleError({ res, err });
  }
};

module.exports.getUserAddress = async ({ user: { _id } }, res) => {
  try {
    const userData = await get(_id);
    let address = '';
    if (userData) {
      address = userData.address;
    }
    handleResponse({ res, data: address });
  } catch (err) {
    handleError({ res, err });
  }
};

module.exports.changePrimaryAddress = async (
  { user: { _id }, params: { addressId } },
  res
) => {
  try {
    const addressChange = await changePrimaryAddress(_id, addressId);
    if (addressChange) {
      const userData = await get(_id);
      address = userData.address;
      handleResponse({ res, data: address, msg: primaryAddress });
    } else {
      handleResponse({ res, result: 0 });
    }
  } catch (err) {
    handleError({ res, err });
  }
};

module.exports.CheckAvailability = async (req, res) => {
  try {
    const { type, value } = req.query;

    if (!['email', 'userName', 'phone'].includes(type)) {
      return handleError({
        res,
        statusCode: 422,
        err: 'You can check the the availability only for email, userName and phone.',
      });
    }

    let query = null;
    switch (type) {
      case 'email':
        query = { email: value };
        break;
      case 'userName':
        query = { userName: value };
        break;
      case 'phone':
        query = { phone: value };
        break;
    }

    const documentCount = await User.countDocuments(query);
    const availabilityFlag = documentCount <= 0;

    handleResponse({
      res,
      data: {
        targetEntity: type,
        targetValue: value,
        availability: availabilityFlag,
      },
      msg: `${_.capitalize(type)} availability fetched successfully.`,
    });
  } catch (err) {
    handleError({ res, err });
  }
};

module.exports.uploadKyc = async (req, res) => {
  try {
    let {
      user: { _id: _user },
      body: { documentOneType, documentTwoType, documentThreeType },
      files: { documentOne, documentTwo, documentThree },
    } = req;
    let DOC_ONE = S3ExtractMeta(documentOne);
    let DOC_TWO = S3ExtractMeta(documentTwo);
    let DOC_THREE = S3ExtractMeta(documentThree);

    let kycObject = [];

    if (DOC_ONE.length) {
      DOC_ONE = {
        key: DOC_ONE[0].key,
        url: DOC_ONE[0].location,
        sizeInMegaByte: DOC_ONE[0].size / 1024 ** 2,
      };
      documentOne = {
        type: documentOneType,
        document: DOC_ONE,
      };
      kycObject.push(documentOne);
    }
    if (DOC_TWO.length) {
      DOC_TWO = {
        key: DOC_TWO[0].key,
        url: DOC_TWO[0].location,
        sizeInMegaByte: DOC_TWO[0].size / 1024 ** 2,
      };
      documentTwo = {
        type: documentTwoType,
        document: DOC_TWO,
      };
      kycObject.push(documentTwo);
    }
    if (DOC_THREE.length) {
      DOC_THREE = {
        key: DOC_THREE[0].key,
        url: DOC_THREE[0].location,
        sizeInMegaByte: DOC_THREE[0].size / 1024 ** 2,
      };
      documentThree = {
        type: documentThreeType,
        document: DOC_THREE,
      };
      kycObject.push(documentThree);
    }

    const uploadKyc = await uploadKycDocument(kycObject, _user);
    if (uploadKyc) {
      return handleResponse({ res, msg: 'Document successfully uploaded' });
    }
    return handleResponse({
      res,
      msg: 'document could not be upload',
      result: 0,
    });
  } catch (err) {
    handleError({ res, err });
  }
};

module.exports.GetAllNotification = async (req, res) => {
  try {
    const { user: __user } = req;
    const { search, startIndex, itemsPerPage } = req.query;

    const notifications = await NotificationService.GetAll({
      _user: __user._id,
      search,
      startIndex,
      itemsPerPage,
    });

    return handleResponse({
      res,
      data: notifications,
      msg: `Notifications fetched successfully.`,
    });
  } catch (err) {
    handleError({ res, err });
  }
};

module.exports.updateKycStatus = async (req, res) => {
  try {
    let = {
      user: { _id: _user },
      body: { userId, status, rejectReason },
    } = req;

    const verifyKycRes = await updateKycStatus(userId, status, rejectReason);
    if (verifyKycRes) {
      return handleResponse({ res, msg: 'Kyc status successfully updated' });
    }
    return handleResponse({
      res,
      msg: 'Something went wrong.',
      result: 0,
    });
  } catch (err) {
    handleError({ res, err });
  }
};

module.exports.resetVIPMember = async (req, res) => {
  try {
    const { _id } = req.query;
    const userData = await resetVIPMember(_id);
    if (!userData) {
      return handleResponse({
        res,
        data: userData,
        msg: `Invalid UserId`,
      });
    }
    return handleResponse({
      res,
      data: userData,
      msg: `VIP Membership reset successfully.`,
    });
  } catch (err) {
    handleError({ res, err });
  }
};

module.exports.getWalletDetails = async (req, res) => {
  try {
    const { _id } = req.query;
    const userData = await getWalletDetails(_id);
    if (!userData) {
      return handleResponse({
        res,
        data: userData,
        msg: `Invalid UserId`,
      });
    }
    return handleResponse({
      res,
      data: userData,
      msg: `Wallet Data fetch successfully`,
    });
  } catch (err) {
    handleError({ res, err });
  }
};

module.exports.getUserTransectionDetails = async (req, res) => {
  try {
    const { _id } = req.query;
    const transectionData = await getUserTransectionDetails(_id);
    if (!transectionData) {
      return handleResponse({
        res,
        data: transectionData,
        msg: `No Transactions found`,
      });
    }
    return handleResponse({
      res,
      data: transectionData,
      msg: `Transactions fetched successfully`,
    });
  } catch (err) {
    handleError({ res, err });
  }
};

module.exports.getTransectionDetails = async (req, res) => {
  try {
    const { _id } = req.query;
    const transectionData = await getTransectionDetails(_id);
    if (!transectionData) {
      return handleResponse({
        res,
        data: transectionData,
        msg: `Transaction Data not found`,
      });
    }
    return handleResponse({
      res,
      data: transectionData,
      msg: `Transaction Fetch Successfully`,
    });
  } catch (err) {
    handleError({ res, err });
  }
};

module.exports.userDataService = async ({ params: { userId } }, res) => {
  try {
    const userData = await userDataService(userId);
    handleResponse({ res, data: userData });
  } catch (err) {
    handleError({ res, err });
  }
};
