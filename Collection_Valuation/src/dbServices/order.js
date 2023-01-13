const _ = require('lodash');
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Seller = require('../models/sellerModel');
const { ObjectId } = require('mongoose').Types;

const Paginator = require('../helpers/pagination.helper');

module.exports.getBuyOrderList = async (options) => {
  const {
    _buyer,
    orderType,
    status,
    startIndex = 1,
    itemsPerPage = 10,
  } = options;

  try {
    let matchObj = {};
    // Filter Data
    matchObj._buyer = { $eq: ObjectId(_buyer) };
    matchObj.orderType = orderType;
    if (status) {
      matchObj.status = { $eq: status };
    }

    let sort = null;
    sort = {
      createdAt: -1,
    };

    const projection = {
      _id: 1,
      _buyer: 1,
      _coin: 1,
      status: 1,
      orderType: 1,
      trackMeta: 1,
      shipping_address: 1,
      createdAt: 1,
    };

    const result = await Paginator.Paginate({
      model: Order,
      query: _.omitBy(matchObj, _.isNil),
      projection: projection,
      sort,
      populate: [
        {
          path: '_coin',
          select: '_id age isGraded userId name pictures price',
        },
      ],
      startIndex: +startIndex,
      itemsPerPage: +itemsPerPage,
    });

    return result;
  } catch (error) {
    throw error;
  }
};

module.exports.getSellOrderList = async (options) => {
  const { _seller, status, startIndex = 1, itemsPerPage = 10 } = options;

  try {
    let matchObj = {};
    // Filter Data
    matchObj._seller = { $eq: ObjectId(_seller) };
    if (status) {
      matchObj.status = { $eq: status };
    }

    let sort = null;
    sort = {
      createdAt: -1,
    };

    const projection = {
      _id: 1,
      _seller: 1,
      _coin: 1,
      status: 1,
      trackMeta: 1,
      shipping_address: 1,
      createdAt: 1,
    };

    const result = await Paginator.Paginate({
      model: Order,
      query: _.omitBy(matchObj, _.isNil),
      projection: projection,
      sort,
      populate: [
        {
          path: '_coin',
          select: '_id age isGraded userId name pictures price',
        },
      ],
      startIndex: +startIndex,
      itemsPerPage: +itemsPerPage,
    });

    return result;
  } catch (error) {
    throw error;
  }
};

module.exports.getOrderDetail = async (options) => {
  const { _user, orderId } = options;

  try {
    let matchObj = {};
    matchObj._id = { $eq: ObjectId(orderId) };

    let sort = null;
    sort = {
      createdAt: -1,
    };

    const projection = {
      // _id: 1,
      // _seller:1,
      // _buyer:1,
      // _coin:1,
      // status:1,
      // trackMeta:1,
      // shipping_address:1,
      // rating:1,
      // createdAt:1
    };

    let data;
    let addressDetails;
    result = await Order.findOne({ _id: ObjectId(orderId) }, projection)
      .populate([
        { path: '_coin' },
        {
          path: '_seller',
          select:
            '_id profilePic firstName lastName phone email userName address sellerReview',
        },
        {
          path: '_buyer',
          select:
            '_id profilePic firstName lastName phone email userName address',
        },
      ])
      .exec();
    if (result.deliveryAddress) {
      result._buyer.address.map((addData) => {
        if (addData._id == result.deliveryAddress) {
          addressDetails = addData;
        }
      });
      data = { result, addressDetails };
    } else {
      result._buyer.address.map((addData) => {
        if (addData.isPrimary == true) {
          addressDetails = addData;
        }
      });
      data = { result, addressDetails };
    }
    return data;
  } catch (error) {
    throw error;
  }
};

module.exports.getsellerDetail = async (options) => {
  const { _user, userId } = options;

  try {
    let matchObj = {};
    matchObj._id = { $eq: ObjectId(userId) };

    let sort = null;
    sort = {
      createdAt: -1,
    };

    const projection = {
      // _id: 1,
      // _seller:1,
      // _buyer:1,
      // _coin:1,
      // status:1,
      // trackMeta:1,
      // shipping_address:1,
      // rating:1,
      // createdAt:1
    };

    result = await Seller.findOne({ _id: ObjectId(userId) }, projection).exec();

    return result;
  } catch (error) {
    throw error;
  }
};

module.exports.getPaymentStatus = async (options) => {
  const { orderId } = options;

  try {
    let matchObj = {};
    matchObj._id = { $eq: ObjectId(orderId) };

    let sort = null;
    sort = {
      createdAt: -1,
    };

    const projection = {
      _id: 1,
      status: 1,
    };

    result = await Order.findOne({ _id: ObjectId(orderId) }, projection).exec();

    return result;
  } catch (error) {
    throw error;
  }
};

module.exports.putsellerReview = async (options) => {
  const { userId, rating, review } = options;

  const Seller = await Seller.findOne({
    _id: ObjectId(userId),
  });

  Seller.rating = {
    rate: rating,
    review: review,
  };
  await Seller.save();

  return Seller;
};

module.exports.putOrderReview = async (options) => {
  const { orderId, rating, review } = options;

  const order = await Order.findOne({
    _id: orderId,
  });

  const seller = await User.findOne({
    _id: order._seller,
  });

  let allReview = seller.toJSON().sellerReview;
  let checkAlreadyExists = false;

  if (allReview.length > 0) {
    for (let i = 0; i < allReview.length; i++) {
      let e = allReview[i];
      if (
        order._buyer.toString() == e._buyer.toString() &&
        order._id.toString() == e._order.toString()
      ) {
        checkAlreadyExists = true;
        seller.sellerReview[i] = {
          rate: rating,
          review: review,
          _buyer: order._buyer,
          _order: order._id,
        };
        await seller.save();
      }
    }

    if (checkAlreadyExists == false) {
      seller.sellerReview[allReview.length] = {
        rate: rating,
        review: review,
        _buyer: order._buyer,
        _order: order._id,
      };

      await seller.save();
    }
  } else {
    seller.sellerReview = [
      {
        rate: rating,
        review: review,
        _buyer: order._buyer,
        _order: order._id,
      },
    ];
    await seller.save();
  }
  return seller;
};

module.exports.postTrackOrder = async (options) => {
  const { orderId, trackId, website, name, comments } = options;

  const order = await Order.findOne({
    _id: orderId,
  });

  order.trackMeta = {
    name: name,
    trackId: trackId,
    website: website,
    comments: comments,
  };
  order.isShipped = true;
  await order.save();

  return order;
};
