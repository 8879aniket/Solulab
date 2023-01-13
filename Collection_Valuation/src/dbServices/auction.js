const Model = require('../models/auctionModel');
const BiddingModel = require('../models/biddingModel');
const { ObjectId } = require('mongoose').Types;

module.exports.save = (data) => new Model(data).save();

module.exports.genrateBid = (data) => new BiddingModel(data).save();

module.exports.getBidData = async (auctionId, userId) => {
  try {
    const bidData = await BiddingModel.find({
      auctionId: ObjectId(auctionId),
      userId: ObjectId(userId),
    });
    return bidData;
  } catch (error) {
    throw error;
  }
};

module.exports.updateBidding = async (auctionId, userId, body) => {
  try {
    const bidData = await BiddingModel.findOneAndUpdate(
      { auctionId: ObjectId(auctionId), userId: ObjectId(userId) },
      { amount: body.amount }
    );
    return bidData;
  } catch (error) {
    throw error;
  }
};

module.exports.getMyAuction = async (userId, skip, limit) => {
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
          from: 'coins',
          localField: 'coinId',
          foreignField: '_id',
          as: 'coinDetails',
        },
      },
      { $unwind: '$coinDetails' },
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

module.exports.update = async (auctionId, { amount }) => {
  try {
    const data = await Model.findByIdAndUpdate(
      auctionId,
      {
        $set: {
          ...(amount && {
            amount,
          }),
        },
      },
      {
        runValidators: true,
        new: true,
      }
    );
    return data;
  } catch (error) {
    throw error;
  }
};

module.exports.deleteAuction = async (_id) => {
  try {
    const { deleteAuction } = await Model.remove({ _id });
    return !!deleteAuction;
  } catch (err) {
    throw err;
  }
};

module.exports.bidListing = async (auctionId, skip, limit) => {
  try {
    let [data] = await BiddingModel.aggregate([
      {
        $match: {
          auctionId: ObjectId(auctionId),
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      { $unwind: '$userDetails' },
      {
        $addFields: {
          'userDetails.amount': '$amount',
          'userDetails.auctionId': '$auctionId',
          'userDetails.biddingId': '$_id',
          'userDetails.coinId': '$coinId',
        },
      },
      { $replaceRoot: { newRoot: '$userDetails' } },
      {
        $project: {
          _id: 1,
          biddingId: 1,
          auctionId: 1,
          coinId: 1,
          profilePic: 1,
          firstName: 1,
          lastName: 1,
          country: 1,
          city: 1,
          rating: 1,
          rating: 1,
          review: 1,
          amount: 1,
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

module.exports.participatedAuctionListing = async (userId, skip, limit) => {
  try {
    let [data] = await BiddingModel.aggregate([
      {
        $match: {
          userId: ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: 'coins',
          localField: 'coinId',
          foreignField: '_id',
          as: 'coinDetails',
        },
      },
      { $unwind: '$coinDetails' },
      {
        $addFields: {
          'coinDetails.amount': '$amount',
          'coinDetails.auctionId': '$auctionId',
        },
      },
      // { $replaceRoot: { newRoot: '$coinDetails' } },
      // {
      //   $project: {
      //     _id: 1,
      //     name: 1,
      //     pictures: 1,
      //     amount: 1,
      //     auctionId: 1,
      //     year: 1,
      //     isGraded: 1,
      //   },
      // },
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

module.exports.awardBuyer = async (auctionId, buyerId) => {
  try {
    const deleteAuctionBids = await BiddingModel.findOneAndDelete({
      auctionId: ObjectId(auctionId),
    });
    if (!!deleteAuctionBids) {
      const { nModified } = await Model.findOneAndUpdate(
        {
          _id: ObjectId(auctionId),
        },
        {
          $set: {
            buyerId,
            isEnded: true,
            isAwarded: true,
          },
        }
      );
      return nModified;
    }
    return false;
  } catch (err) {
    throw err;
  }
};

module.exports.getAuctionDetails = async (auctionId) => {
  try {
    let [data] = await Model.aggregate([
      {
        $match: {
          _id: ObjectId(auctionId),
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      {
        $unwind: {
          path: '$userDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'buyerId',
          foreignField: '_id',
          as: 'buyerDetails',
        },
      },
      {
        $unwind: {
          path: '$buyerDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);
    return data;
  } catch (error) {
    throw error;
  }
};
