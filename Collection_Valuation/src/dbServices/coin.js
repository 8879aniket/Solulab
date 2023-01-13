const _ = require('lodash');
const Coin = require('../models/coinModel');
const Model = require('../models/coinModel');
const User = require('../models/userModel');
const WishList = require('../models/wishListModel');
const contactUs = require('../models/contactUsModel');
const { ObjectId } = require('mongoose').Types;

const Paginator = require('../helpers/pagination.helper');

module.exports.Model = Model;

module.exports.save = (data) => new Model(data).save();

module.exports.addCoinToWishList = async (data) => {
  const wishList = new WishList(data);
  await wishList.save();
  return wishList;
};

module.exports.addMessage = async (data) => {
  const message = new contactUs(data);
  await message.save();
  return message;
};

module.exports.get = async (idOrEmail, fieldName = '_id') => {
  const data = await Model.findOne({
    [fieldName]: `${idOrEmail}`,
    isDeleted: false,
  });
  return data;
};

module.exports.update = async (
  userId,
  { firstName, lastName, password, email, phone, token, otp, otpExpiry, link }
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
    const data = await this.getUserProfileData(userId);
    return data;
  } catch (error) {
    throw error;
  }
};

module.exports.myPortfolio = async (userId, skip, limit) => {
  try {
    let [data] = await Model.aggregate([
      {
        $match: {
          userId: ObjectId(userId),
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: 'auctions',
          let: { coinId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$coinId', '$$coinId'],
                },
              },
            },
            {
              $project: {
                _id: 1,
              },
            },
          ],
          as: 'isAuctioned',
        },
      },
      {
        $addFields: {
          isAuctioned: {
            $cond: {
              if: {
                $eq: ['$isAuctioned', []],
              },
              then: false,
              else: true,
            },
          },
        },
      },
      {
        $facet: {
          list: [
            {
              $skip: skip,
            },
            {
              $limit: limit,
            },
          ],
          totalRecords: [
            {
              $count: 'count',
            },
          ],
        },
      },
      {
        $addFields: {
          totalRecords: '$totalRecords.count',
        },
      },
      {
        $unwind: {
          path: '$totalRecords',
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);
    return data;
  } catch (error) {
    throw error;
  }
};

module.exports.coinDetails = async (coinId, userId) => {
  try {
    let data = await Model.aggregate([
      {
        $match: {
          _id: ObjectId(coinId),
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: 'wishlists',
          let: { coinId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$coinId', '$$coinId'] },
                    { $eq: ['$userId', userId] },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 1,
              },
            },
          ],
          as: 'inWishList',
        },
      },
      {
        $addFields: {
          inWishList: {
            $cond: {
              if: {
                $eq: ['$inWishList', []],
              },
              then: false,
              else: true,
            },
          },
        },
      },
      {
        $lookup: {
          from: 'auctions',
          let: { coinId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$coinId', '$$coinId'],
                },
              },
            },
            // {
            //   $project: {
            //     _id: 1,
            //   },
            // },
          ],
          as: 'isAuctioned',
        },
      },
      {
        $unwind: {
          path: '$isAuctioned',
          preserveNullAndEmptyArrays: true,
        },
      },
      // {
      //   $addFields: {
      //     isAuctioned: {
      //       $cond: {
      //         if: {
      //           $eq: ['$isAuctioned', []],
      //         },
      //         then: false,
      //         else: true,
      //       },
      //     },
      //   },
      // },
      {
        $addFields: {
          isCoinOfLoggedIn: {
            $cond: {
              if: {
                $eq: [userId, '$userId'],
              },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          let: { userId: '$userId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$userId'],
                },
              },
            },
            {
              $project: {
                firstName: 1,
                lastName: 1,
                profilePic: 1,
                country: 1,
                city: 1,
              },
            },
          ],
          as: 'userData',
        },
      },
      {
        $unwind: {
          path: '$userData',
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    if (data.length > 0) {
      [data] = data;
    }

    return data;
  } catch (error) {
    throw error;
  }
};

module.exports.removeCoinToWishList = async (userId, coinId) => {
  try {
    const data = await WishList.deleteOne({ userId, coinId });
    return data;
  } catch (error) {
    throw error;
  }
};
module.exports.getMessage = async (userId, skip, limit) => {
  try {
    let [data] = await contactUs.aggregate([
      {
        $match: {
          userId: ObjectId(userId),
        },
      },
    ]);
    return data;
  } catch (error) {
    throw error;
  }
};
module.exports.getWishList = async (userId, skip, limit) => {
  try {
    let [data] = await WishList.aggregate([
      {
        $match: {
          userId: ObjectId(userId),
        },
      },
      {
        $unwind: {
          path: '$userData',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'coins',
          let: { coinId: '$coinId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$coinId'],
                },
              },
            },
            {
              $project: {
                name: 1,
                age: 1,
                isSold: 1,
                isGraded: 1,
                price: 1,
                history: 1,
                shape: 1,
                pictures: 1,
                userId: 1,
              },
            },
          ],
          as: 'coinData',
        },
      },
      {
        $unwind: {
          path: '$coinData',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          let: { userId: '$coinData.userId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$userId'],
                },
              },
            },
            {
              $project: {
                firstName: 1,
                lastName: 1,
                review: 1,
                rating: 1,
                address: 1,
              },
            },
          ],
          as: 'userData',
        },
      },
      {
        $unwind: {
          path: '$userData',
          // preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          'coinData._id': '$_id',
          'coinData.coinId': '$coinId',
          'coinData.firstName': '$userData.firstName',
          'coinData.lastName': '$userData.lastName',
          'coinData.review': {
            $cond: {
              if: {
                $ne: ['$userData.review', undefined],
              },
              then: { $size: '$userData.review' },
              else: 0,
            },
          },
          'coinData.rating': '$userData.rating',
          'coinData.userId': '$userId',
          'coinData.address': {
            $filter: {
              input: '$userData.address',
              as: 'address',
              cond: {
                $and: [{ $eq: ['$$address.isPrimary', true] }],
              },
            },
          },
        },
      },
      {
        $replaceRoot: { newRoot: '$coinData' },
      },
      {
        $lookup: {
          from: 'auctions',
          let: { coinId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$coinId', '$$coinId'],
                },
              },
            },
            {
              $project: {
                _id: 1,
              },
            },
          ],
          as: 'isAuctioned',
        },
      },
      {
        $addFields: {
          isAuctioned: {
            $cond: {
              if: {
                $eq: ['$isAuctioned', []],
              },
              then: false,
              else: true,
            },
          },
        },
      },
      {
        $unwind: {
          path: '$address',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $facet: {
          list: [
            {
              $skip: skip,
            },
            {
              $limit: limit,
            },
          ],
          totalRecords: [
            {
              $count: 'count',
            },
          ],
        },
      },
      {
        $addFields: {
          totalRecords: '$totalRecords.count',
        },
      },
      {
        $unwind: {
          path: '$totalRecords',
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);
    return data;
  } catch (error) {
    throw error;
  }
};

module.exports.getCoinList = async (options) => {
  const {
    _id,
    country,
    grading,
    isGraded,
    isSold,
    marketPlaceState,
    shape,
    material,
    fromYear,
    toYear,
    fromPrice,
    toPrice,
    sortPrice,
    sortName,
    search,
    isCoin,
    startIndex = 1,
    itemsPerPage = 10,
  } = options;
  try {
    let matchObj = {};

    if (search) {
      matchObj.$or = [
        {
          tags: {
            $elemMatch: { $regex: search, $options: 'i' },
          },
        },
        {
          name: { $regex: search, $options: 'i' },
        },
      ];
    }
    // matchObj.$and= [ {
    //   userId: { $ne: null }
    // }]
    matchObj.country = country ?? undefined;
    // matchObj.isDeleted = false
    matchObj.isCoin = isCoin ?? undefined;
    matchObj.shape = shape ?? undefined;
    matchObj.grading = grading ? { $regex: grading, $options: 'i' } : undefined;
    matchObj.isGraded = isGraded ?? undefined;
    matchObj.isSold = isSold ?? undefined;
    matchObj.material = material ?? undefined;
    matchObj.marketPlaceState = marketPlaceState ?? undefined;

    if (fromYear) {
      matchObj.year = { $gte: fromYear };
    }

    if (toYear) {
      matchObj.year = matchObj.year
        ? (matchObj.year.$lte = toYear)
        : { $lte: toYear };
    }

    if (fromPrice) {
      matchObj.price = { $gte: fromPrice };
    }

    if (toPrice) {
      if (matchObj.price && matchObj.price.$gte) {
        matchObj.price.$lte = toPrice;
      } else {
        matchObj.price = {};
        matchObj.price.$lte = toPrice;
      }
    }

    const projection = {
      _id: 1,
      userId: 1,
      name: 1,
      age: 1,
      isSold: 1,
      isGraded: 1,
      price: 1,
      year: 1,
      shape: 1,
      history: 1,
      pictures: 1,
      tags: 1,
      isCoin: 1,
      marketPlaceState: 1,
      _auction: 1,
      isWishlist: 1,
    };

    let sort = null;
    if (sortPrice) {
      sort = {
        price: [1, -1].includes(sortPrice) ? sortPrice : 1,
      };
    } else {
      sort = {
        created: -1,
      };
    }
    if (sortName == 'Asc') {
      sort = {
        name: 1,
      };
    } else {
      sort = {
        name: -1,
      };
    }
    const result = await Paginator.Paginate({
      model: Coin,
      query: _.omitBy(matchObj, _.isNil),
      projection: projection,
      sort,
      populate: [
        {
          path: 'userId',
          select: 'firstName middleName lastName profilePic isDeleted',
        },

        {
          path: '_auction',
        },
      ],

      startIndex: +startIndex,
      itemsPerPage: +itemsPerPage,
    });

    const { items } = result;

    for (i = 0; i < items.length; i++) {
      let is_wishlist = await WishList.findOne({
        userId: ObjectId(_id),
        coinId: ObjectId(items[i]._id),
      });
      if (is_wishlist) {
        items[i].isWishlist = true;
      } else {
        items[i].isWishlist = false;
      }
    }

    return result;

    let [data] = await User.aggregate([
      {
        $match: {
          _id: { $ne: ObjectId(_id) },
          country,
        },
      },
      {
        $lookup: {
          from: 'coins',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$userId', '$$userId'],
                },
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
                age: 1,
                isSold: 1,
                isGraded: 1,
                price: 1,
                year: 1,
                shape: 1,
                history: 1,
                pictures: 1,
                tags: 1,
                isCoin: 1,
              },
            },
          ],
          as: 'coinData',
        },
      },
      {
        $unwind: {
          path: '$coinData',
        },
      },
      {
        $addFields: {
          'coinData.firstName': '$firstName',
          'coinData.lastName': '$lastName',
          'coinData.review': { $size: '$review' },
          'coinData.rating': '$rating',
          'coinData.userId': '$_id',
          'coinData.address': {
            $filter: {
              input: '$address',
              as: 'address',
              cond: {
                $and: [{ $eq: ['$$address.isPrimary', true] }],
              },
            },
          },
        },
      },
      {
        $replaceRoot: { newRoot: '$coinData' },
      },
      {
        $unwind: {
          path: '$address',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'auctions',
          let: { coinId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$coinId', '$$coinId'],
                },
              },
            },
            {
              $project: {
                _id: 1,
              },
            },
          ],
          as: 'isAuctioned',
        },
      },
      {
        $addFields: {
          isAuctioned: {
            $cond: {
              if: {
                $eq: ['$isAuctioned', []],
              },
              then: false,
              else: true,
            },
          },
        },
      },
      {
        $lookup: {
          from: 'wishlists',
          let: { coinId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$coinId', '$$coinId'] },
                    { $eq: ['$userId', _id] },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 1,
              },
            },
          ],
          as: 'inWishList',
        },
      },
      {
        $addFields: {
          inWishList: {
            $cond: {
              if: {
                $eq: ['$inWishList', []],
              },
              then: false,
              else: true,
            },
          },
          tags: {
            $ifNull: ['$tags', []],
          },
        },
      },
      {
        $match: matchObj,
      },
      { $sort: { price: parseInt(sortPrice) } },
      {
        $facet: {
          list: [
            {
              $skip: skip,
            },
            {
              $limit: limit,
            },
          ],
          totalRecords: [
            {
              $count: 'count',
            },
          ],
        },
      },
      {
        $addFields: {
          totalRecords: '$totalRecords.count',
        },
      },
      {
        $unwind: {
          path: '$totalRecords',
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);
    return data;
  } catch (error) {
    throw error;
  }
};

module.exports.getRelatedCoins = async (
  coinId,
  country,
  age,
  year,
  material
) => {
  try {
    let matchObj = {};
    let userIds = await User.aggregate([
      {
        $match: {
          country,
        },
      },
    ]);

    const userId = userIds.map(function (obj) {
      return obj._id;
    });

    matchObj._id = { $ne: ObjectId(coinId) };
    matchObj.isDeleted = false;
    matchObj.$or = [
      {
        age,
      },
      {
        year,
      },
      {
        material,
      },
      {
        userId: { $in: userId },
      },
    ];

    let [data] = await Model.aggregate([
      {
        $match: matchObj,
      },
      {
        $project: {
          _id: 1,
          name: 1,
          pictures: 1,
        },
      },
      {
        $facet: {
          list: [
            {
              $skip: 0,
            },
            {
              $limit: 5,
            },
          ],
        },
      },
    ]);

    return data;
  } catch (error) {
    throw error;
  }
};

module.exports.getGradeCoinList = async (_id) => {
  try {
    const coinList = await Model.find({ userId: _id, isGraded: true });
    return coinList;
  } catch (error) {
    throw error;
  }
};
