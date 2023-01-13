const Model = require('../models/userModel');
const countries = require('../models/countryModel');
const Order = require('../models/orderModel');
const { ObjectId } = require('mongoose').Types;
const { mongo } = require('mongoose');
const uuid = require('uuid');
const _ = require('lodash');
const { isNull } = require('lodash');
const Transection = require('../models/transactionModel');

module.exports.save = async (data) => await new Model(data).save();

module.exports.getAll = async () => {
  try {
    const data = await Model.find();
    return data;
  } catch (err) {
    throw err;
  }
};

module.exports.get = async (idOrEmail, fieldName = '_id', select = null) => {
  const data = await Model.findOne({
    [fieldName]: `${idOrEmail}`,
    isDeleted: false,
  }).select(select);
  return data;
};

module.exports.getWithMultipleFields = async (fields, select = null) => {
  const user = await Model.findOne({
    ...fields,
    isDeleted: false,
  }).select(select);
  return user;
};

module.exports.update = async (
  userId,
  {
    firstName,
    lastName,
    password,
    email,
    phone,
    token,
    otp,
    otpExpiry,
    link,
    kycDetails,
    gender,
    dob,
    profilePic,
    fcmToken,
    country,
  },
  select = null
) => {
  try {
    await Model.findByIdAndUpdate(
      userId,
      {
        $set: {
          ...(firstName && {
            firstName,
          }),
          ...(lastName && {
            lastName,
          }),
          ...(email && {
            email,
          }),
          ...(password && {
            password,
          }),
          ...(phone && {
            phone,
          }),
          ...(token && {
            token,
          }),
          ...(otp && {
            otp,
          }),
          ...(otpExpiry && {
            otpExpiry,
          }),
          ...(link && {
            link,
          }),
          ...(kycDetails && {
            kycDetails,
          }),
          ...(gender && {
            gender,
          }),
          ...(dob && {
            dob,
          }),
          ...(profilePic && {
            profilePic,
          }),
          ...(fcmToken && {
            fcmToken,
          }),
          ...(country && {
            country,
          }),
        },
      },
      {
        runValidators: true,
        new: true,
        projection: {
          password: 0,
        },
      }
    );
    const data = await this.get(userId, '_id', select);
    return data;
  } catch (error) {
    throw error;
  }
};

module.exports.getOtpByPhone = async (countryCode, phone, otp) => {
  try {
    const filter = {
      countryCode: countryCode,
      phone: phone,
      otp: otp,
      otpExpiry: { $gte: new Date().toISOString() },
    };
    return Model.findOne(filter, function (err) {
      if (err) {
        return false;
      }
      return true;
    });
  } catch (error) {
    throw error;
  }
};

module.exports.updatePassword = async (
  countryCode,
  phone,
  password,
  email = null
) => {
  try {
    let filter;
    if (!email) filter = { countryCode, phone };
    else filter = { email };
    let user = await Model.findOne(filter);
    if (!user) {
      return false;
    }

    user.password = password;
    await user.save();
    return true;
  } catch (error) {
    throw error;
  }
};

module.exports.chkLink = async (link) => {
  try {
    const resp = await Model.findOneAndUpdate(
      { link },
      { link: '', isEmailVerified: true }
    );
    return resp;
  } catch (err) {
    throw err;
  }
};

module.exports.getSocialUser = async (loginType, socialId, email) => {
  try {
    const filter = {
      email: email,
      loginType: loginType,
      socialId: socialId,
      isDeleted: false,
    };
    return Model.findOne(filter, function (err, obj) {
      if (err) {
        return false;
      }
      return obj;
    });
  } catch (error) {
    throw error;
  }
};

module.exports.getUserName = async (countryCode, phone, otp) => {
  try {
    const filter = {
      countryCode: countryCode,
      phone: phone,
      otp: otp,
      otpExpiry: { $gte: new Date().toISOString() },
    };
    return Model.findOne(filter, function (err) {
      if (err) {
        return false;
      }
      return true;
    });
  } catch (error) {
    throw error;
  }
};

module.exports.addRateingReview = async (
  rating,
  review,
  previousRating,
  userId
) => {
  try {
    const avg = (rating * 1 + previousRating * 1) / 2;

    const updata = await Model.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          rating: avg,
        },
        $push: {
          review,
        },
      },
      { new: true }
    );

    return updata;
  } catch (error) {
    throw error;
  }
};

module.exports.addAddress = async (userId, data) => {
  try {
    const userData = await Model.findOne({ _id: ObjectId(userId) });
    if (data.isPrimary && userData.address) {
      userData.address.map((e) => (e.isPrimary = false));
    }
    userData.address.push({
      name: data.name,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      addressLine3: data.addressLine3,
      city: data.city,
      country: data.country,
      postalCode: data.postalCode,
      phone: data.phone,
      email: data.email,
      isPrimary: data.isPrimary,
    });
    let doc = await userData.save();
    return doc;
  } catch (error) {
    throw error;
  }
};

module.exports.updateAddress = async (userId, data) => {
  try {
    const userData = await Model.findOne({ _id: userId });
    const targetAddressId = data.id;
    let addressData = userData.toJSON().address;

    if (!addressData) {
      return null;
    }
    if (addressData) {
      addressData.map((e) => {
        if (e._id.toString() == targetAddressId) {
          if (typeof data.isPrimary === 'undefined') {
            data.isPrimary = e.isPrimary;
          }
        } else {
          if (data.isPrimary == true) {
            e.isPrimary = false;
          }
        }
      });
    }

    const updateObj = {
      _id: targetAddressId,
      name: data.name ?? addressData.name,
      addressLine1: data.addressLine1 ?? addressData.addressLine1,
      addressLine2: data.addressLine2 ?? addressData.addressLine2,
      addressLine3: data.addressLine3 ?? addressData.addressLine3,
      city: data.city ?? addressData.city,
      country: data.country ?? addressData.country,
      postalCode: data.postalCode ?? addressData.postalCode,
      phone: data.phone ?? addressData.phone,
      email: data.email ?? addressData.email,
      isPrimary: data.isPrimary ?? addressData.isPrimary,
    };

    for (let i = 0; i < addressData.length; i++) {
      let e = addressData[i];
      if (e._id.toString() == targetAddressId) {
        addressData[i] = updateObj;
      }
    }

    userData.address = addressData;
    await userData.save();
    return userData;
  } catch (error) {
    throw error;
  }
};

module.exports.removeAddress = async (userId, addressId) => {
  try {
    const userData = await Model.findOne({ _id: ObjectId(userId) });
    userData.address.pull(addressId);

    // If we are having only one address left, then that would the primary address by default
    if (userData.address.length == 1) {
      userData.address[0].isPrimary = true;
    }
    let doc = userData.save();
    return doc;
  } catch (error) {
    throw error;
  }
};

module.exports.logout = async (id) => {
  try {
    const logout = Model.findByIdAndUpdate(
      {
        _id: id,
      },
      {
        $set: {
          token: '',
          fcmToken: '',
        },
      },
      {
        new: true,
      }
    );
    return logout;
  } catch (err) {
    throw err;
  }
};

module.exports.getCountries = async () => {
  try {
    const data = await countries.find({}, 'name phone_code');
    return data;
  } catch (err) {
    throw err;
  }
};

module.exports.changePrimaryAddress = async (userId, addressId) => {
  try {
    const { nModified } = await Model.update(
      {
        _id: ObjectId(userId),
        'address.isPrimary': true,
      },
      { 'address.$.isPrimary': false }
    );

    if (!!nModified) {
      const data = await Model.update(
        {
          _id: ObjectId(userId),
          'address._id': ObjectId(addressId),
        },
        { 'address.$.isPrimary': true }
      );
      return true;
    }
    return false;
  } catch (err) {
    throw err;
  }
};

module.exports.verifyPhone = async (countryCode, phone, otp) => {
  try {
    await Model.updateOne(
      {
        countryCode,
        phone,
        otp,
      },
      {
        isPhoneVerified: true,
        $unset: {
          otp: 1,
          otpExpiry: 1,
        },
      }
    );

    return true;
  } catch (err) {
    throw err;
  }
};

module.exports.verifyEmail = async (email, otp) => {
  try {
    await Model.updateOne(
      {
        email,
        otp,
      },
      {
        isEmailVerified: true,
        $unset: {
          otp: 1,
          otpExpiry: 1,
        },
      }
    );

    return true;
  } catch (err) {
    throw err;
  }
};

module.exports.verifyOTPForForgotPassword = async (options) => {
  const { _user, otp } = options;
  try {
    const referenceToken = uuid.v4();
    const user = await Model.findOne({
      _id: _user,
      otp,
    });

    user.otp = undefined;
    user.otpExpiry = undefined;
    user.referenceToken = referenceToken;
    await user.save();
    return user.toJSON();
  } catch (err) {
    throw err;
  }
};

module.exports.uploadKycDocument = async (options, _user) => {
  const user = await Model.findOne({
    _id: _user,
  });
  user.kycDocument = options;
  user.kyc.isKyc = 'pending';
  await user.save();
  return user;
};

module.exports.updateKycStatus = async (userId, status, rejectReason) => {
  const user = await Model.findOne({
    _id: userId,
  });
  user.kyc.isKyc = status;
  if (rejectReason) {
    user.kyc.kycRejectReason = rejectReason;
  }
  await user.save();
  return user;
};

module.exports.resetVIPMember = async (userId) => {
  const user = await Model.findOneAndUpdate(
    { _id: userId },
    {
      isVIPMemeber: false,
    },
    { new: true }
  );
  return user;
};

module.exports.getWalletDetails = async (userId) => {
  const user = await Model.findOne({
    _id: userId,
  });
  const userData = {
    isVIPMemeber: user.isVIPMemeber,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    creditCount: user.creditCount,
    vipMemberStartDate: user.vipMemberStartDate,
    vipMemberEndDate: user.vipMemberEndDate,
  };
  return userData;
};

module.exports.getUserTransectionDetails = async (_id) => {
  const transectionData = await Transection.find({
    userId: _id,
  }).sort({ createdAt: -1 });
  return transectionData;
};

module.exports.getTransectionDetails = async (_id) => {
  const transectionData = await Transection.find({
    _id,
  }).sort({ createdAt: -1 });
  return transectionData;
};

module.exports.userDataService = async (
  idOrEmail,
  fieldName = '_id',
  select = null
) => {
  const response = await Model.findOne({
    [fieldName]: `${idOrEmail}`,
    isDeleted: false,
  });
  if (response) {
    const coin_bought = await Order.countDocuments({
      _buyer: response._id,
      status: 'confirmed',
      orderType: 'coinSale',
    });
    const coin_sold = await Order.countDocuments({
      _seller: response._id,
      status: 'confirmed',
      orderType: 'coinSale',
    });
    const data = { response, coin_bought, coin_sold };
    return { response, coin_bought, coin_sold };
  }
  return response;
};
