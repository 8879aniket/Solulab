const moment = require('moment');

const {
  handleResponse,
  handleError,
} = require('../common/middlewares/requestHandlers');

const {
  notificationSettings: {
    notificationTypes,
    deliveryModesForNotificationTypes,
  },
} = require('../config/config');

const {
  save,
  getMyAuction,
  update,
  deleteAuction,
  genrateBid,
  bidListing,
  participatedAuctionListing,
  awardBuyer,
  getAuctionDetails,
  getBidData,
  updateBidding,
} = require('../dbServices/auction');

const { Model: CoinModel } = require('../dbServices/coin');

const { save: saveNotification } = require('../dbServices/notification');

const {
  auctionCreated,
  auctionUpdated,
  auctionDeleted,
  genratedBid,
} = require('../messages/success');

module.exports.createAuction = async (req, res) => {
  try {
    const { body, user: __user } = req;
    const { startDateTime: _startDateTime, endDateTime: _endDateTime } = body;

    body.userId = __user._id.toString();
    const currentTime = moment();

    let startTime = moment(_startDateTime, moment.defaultFormat);
    startTime = startTime.isValid() ? startTime : null;
    let endDateTime = moment(_endDateTime, moment.defaultFormat);
    endDateTime = endDateTime.isValid() ? endDateTime : null;

    if (_startDateTime == 'now') {
      startTime = currentTime;
    }

    if (!startTime || !endDateTime) {
      return handleError({
        statusCode: 400,
        res,
        err: 'StartTime or EndDateTime is invalid.',
      });
    }

    if (!startTime || startTime.diff(currentTime) < 0) {
      return handleError({
        statusCode: 400,
        res,
        err: "Start time must be greater then the current time.",
      });
    }

    if (!endDateTime || endDateTime.diff(startTime) < 0) {
      return handleError({
        statusCode: 400,
        res,
        err: 'EndTime need to be greater that the StartTime.',
      });
    }

    body.startDT = startTime.toISOString();
    body.endDT = endDateTime.toISOString();
    const auction = await save(body);

    const coin = await CoinModel.findById(auction.coinId);
    coin.marketPlaceState = 'ON_AUCTION';
    coin._auction = auction._id;
    await coin.save();

    return handleResponse({ res, msg: auctionCreated, data: auction });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.getMyAuction = async (
  { user: { _id }, query: { skip, limit } },
  res
) => {
  try {
    const coins = await getMyAuction(_id, +skip || 0, +limit || 10);
    return handleResponse({ res, data: coins });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.updateAuction = async ({ params: { auctionId }, body }, res) => {
  try {
    const data = await update(auctionId, body);
    return handleResponse({ res, msg: auctionUpdated, data });
  } catch (err) {
    handleError({ res, err });
  }
};

module.exports.deleteAuction = async ({ params: { auctionId } }, res) => {
  try {
    const data = await deleteAuction(auctionId);
    return handleResponse({ res, msg: auctionDeleted, data });
  } catch (err) {
    handleError({ res, err });
  }
};

module.exports.bidOnCoin = async ({ body }, res) => {
  try {
    const { auctionId, userId } = body;
    const bidData = await getBidData(auctionId, userId);
    let bid;
    if (bidData.length === 0) {
      bid = await genrateBid(body);
    } else {
      bid = await updateBidding(auctionId, userId, body);
    }
    const userData = await getAuctionDetails(auctionId);
    await saveNotification({
      notificationType: notificationTypes.BID_RECEIVED,
      deliveryModes:
        deliveryModesForNotificationTypes[notificationTypes.BID_RECEIVED],
      to: userData.userDetails._id,
      metadata: {
        title: `New bid`,
        body: `New bid on coin`,
        auctionId,
        userId,
      },
      deliveryInfo: {
        push: userData.userDetails.fcmToken,
      },
    });
    return handleResponse({ res, msg: genratedBid, data: bid });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.bidListing = async (
  { params: { auctionId }, query: { skip, limit } },
  res
) => {
  try {
    const bids = await bidListing(auctionId, +skip || 0, +limit || 10);
    return handleResponse({ res, data: bids });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.participatedAuctionListing = async (
  { user: { _id }, query: { skip, limit } },
  res
) => {
  try {
    const autions = await participatedAuctionListing(
      _id,
      +skip || 0,
      +limit || 10
    );
    if (autions) {
      return handleResponse({ res, data: autions });
    }
    return handleResponse({ res, result: 0 });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.awardBuyer = async ({ body: { auctionId, buyerId } }, res) => {
  try {
    const award = await awardBuyer(auctionId, buyerId);
    const auctionData = await getAuctionDetails(auctionId);
    await saveNotification({
      notificationType: notificationTypes.COIN_AWARDED,
      deliveryModes:
        deliveryModesForNotificationTypes[notificationTypes.COIN_AWARDED],
      to: auctionData.userDetails._id,
      metadata: {
        title: `Bid Awarded`,
        body: `You have been awarded on your bid`,
        auctionId,
        coinId: auctionData.coinId,
      },
      deliveryInfo: {
        push: auctionData.buyerDetails.fcmToken,
      },
    });
    return handleResponse({ res, msg: genratedBid, data: award });
  } catch (err) {
    return handleError({ res, err });
  }
};
