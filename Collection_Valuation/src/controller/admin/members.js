const Model = require("../../models/userModel");
const coinModel = require("../../models/coinModel");
const mongoose = require("mongoose");
const _ = require("lodash");
const { save: saveNotification } = require("../../dbServices/notification");
const {
  notificationSettings: {
    notificationTypes,
    deliveryModesForNotificationTypes,
  },
} = require("../../config/config");
const {
  handleResponse,
  handleError,
} = require("../../common/middlewares/requestHandlers");

module.exports.getAll = async (req, res) => {
  try {
    const loggedInUser = req.user;
    const data = await Model.aggregate([
      {
        $project: {
          firstName: 1,
          lastName: 1,
          email: 1,
          phone: 1,
          isBlocked: 1,
        },
      },
    ]);
    res.render("admin/member/members", { data, loggedInUser });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.getOne = async (req, res) => {
  try {
    const loggedInUser = req.user;
    const { id } = req.params;
    let userId = mongoose.Types.ObjectId(id);
    const data = await Model.aggregate([
      {
        $match: {
          _id: userId,
        },
      },
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "_seller",
          as: "userData",
        },
      },
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "_buyer",
          as: "userData1",
        },
      },
      {
        $unwind: {
          path: "$userData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$userData1",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "coins",
          localField: "userData._coin",
          foreignField: "_id",
          as: "soldCoins",
        },
      },
      {
        $lookup: {
          from: "coins",
          localField: "userData1._coin",
          foreignField: "_id",
          as: "boughtCoins",
        },
      },
      {
        $unwind: {
          path: "$soldCoins",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$boughtCoins",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          "userName": 1,
          "firstName": 1,
          "lastName": 1,
          "kycDocument": 1,
          "email": 1,
          "phone": 1,
          "address": 1,
          "profilePic": 1,
          "soldCoins.name": 1,
          "soldCoins.isGraded": 1,
          "soldCoins.price": 1,
          "soldCoins.marketPlaceState": 1,
          "soldCoins.status": 1,
          "soldCoins.history": 1,
          "soldCoins._id": 1,
          "soldCoins.gradingStatus": 1,
          "boughtCoins.name": 1,
          "boughtCoins.isGraded": 1,
          "boughtCoins.price": 1,
          "boughtCoins.marketPlaceState": 1,
          "boughtCoins.status": 1,
          "boughtCoins.history": 1,
          "boughtCoins._id": 1,
          "boughtCoins.gradingStatus": 1,
        },
      },
    ]);
    const totalCoins = await coinModel.aggregate([
      {
        $match: {
          userId: userId,
        },
      },
      {
        $project: {
          name: 1,
          price: 1,
          marketPlaceState: 1,
          status: 1,
          isGraded: 1,
          history: 1,
        },
      },
    ]);
    // return handleResponse({ res, data:{data, totalCoins, wishLists} })
    res.render("admin/member/memberDetails", {
      data,
      totalCoins,
      loggedInUser,
    });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await Model.findById({ _id: userId });
    if (data.isBlocked === false) {
      data.isBlocked = true;
      await data.save();
      return handleResponse({ res, data });
    } else {
      data.isBlocked = false;
      await data.save();
      return handleResponse({ res, data });
    }
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.kyc = async (req, res) => {
  try {
    let successMessage = req.flash("success");
    if (successMessage.length > 0) {
      successMessage = successMessage[0];
    } else {
      successMessage = null;
    }
    const loggedInUser = req.user;
    const verifiedKyc = await Model.aggregate([
      {
        $match: {
          "kyc.isKyc": "verified",
        },
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          created: 1,
        },
      },
    ]);
    const pendingKyc = await Model.aggregate([
      {
        $match: {
          "kyc.isKyc": "notVerified",
        },
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          created: 1,
        },
      },
    ]);
    const rejectedKyc = await Model.aggregate([
      {
        $match: {
          "kyc.isKyc": "reject",
        },
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          created: 1,
        },
      },
    ]);
    // return handleResponse({ res, data: {verifiedKyc, pendingKyc, rejectedKyc} })
    return res.render("admin/kyc/kycRequests", {
      verifiedKyc,
      pendingKyc,
      rejectedKyc,
      loggedInUser,
      success: successMessage,
    });
  } catch (err) {
    return handleError({ res, err });
  }
};
module.exports.getKycDetails = async (req, res) => {
  try {
    const loggedInUser = req.user;
    const { userId } = req.params;
    const data = await Model.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(userId),
        },
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          dob: 1,
          email: 1,
          country: 1,
          phone: 1,
          city: 1,
          created: 1,
          "kyc.isKyc": 1,
          kycDocument: 1,
          "kyc.kycRejectReason": 1,
        },
      },
    ]);
    // return handleResponse({ res, data })
    return res.render("admin/kyc/viewKycDetail", { loggedInUser, data });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.approveKyc = async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await Model.findByIdAndUpdate(
      { _id: userId },
      {
        $set: {
          "kyc.isKyc": "verified",
          "kyc.status": true,
          "kyc.kycRejectReason": null,
        },
      },
      { new: true }
    );

    // return handleResponse({ res, data })
  } catch (err) {
    return handleError({ res, err });
  }
};
module.exports.rejectKyc = async (req, res) => {
  try {
    const { userId } = req.params;
    const { kycRejectReason } = req.body;
    const data = await Model.findById({ _id: userId });
    if (!data) {
      return handleResponse({ res, result: 0, msg: "User not found" });
    } else {
      data.kyc.isKyc = "reject";
      data.kyc.status = false;
      data.kyc.kycRejectReason = kycRejectReason;
      await data.save();
      await saveNotification({
        notificationType: notificationTypes.KYC_REJECTED,
        to: data._id,
        metadata: {
          body: `Your KYC verification has been rejected due to ${kycRejectReason}`,
        },
        deliveryInfo: {
          sms: data.countryCode + data.phone,
          email: data.email,
        },
      });
      req.flash("success", "KYC has been rejected successfully!");
      return res.redirect("/admin/kycRequests");
      // return handleResponse({ res, data })
    }
  } catch (err) {
    return handleError({ res, err });
  }
};
