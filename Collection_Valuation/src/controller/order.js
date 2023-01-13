const {
  handleResponse,
  handleError,
} = require('../common/middlewares/requestHandlers');

const {
  getBuyOrderList,
  getSellOrderList,
  getOrderDetail,
  putOrderReview,
  postTrackOrder,
  getsellerDetail,
  putsellerReview,
  getPaymentStatus,
} = require('../dbServices/order');

module.exports.buyOrderList = async (req, res) => {
  try {
    let {
      user: { _id: _buyer },
      query: { startIndex, itemsPerPage, orderType, status },
    } = req;

    const buyOrderList = await getBuyOrderList({
      _buyer,
      status,
      orderType,
      startIndex: +startIndex,
      itemsPerPage: +itemsPerPage,
    });
    return handleResponse({ res, data: buyOrderList });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.sellOrderList = async (req, res) => {
  try {
    let {
      user: { _id: _seller },
      query: { startIndex, itemsPerPage, status },
    } = req;

    const sellOrderList = await getSellOrderList({
      _seller,
      status,
      startIndex: +startIndex,
      itemsPerPage: +itemsPerPage,
    });
    return handleResponse({ res, data: sellOrderList });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.orderDetail = async (req, res) => {
  try {
    let {
      user: { _id: _user },
      params: { orderId },
    } = req;

    const orderDetail = await getOrderDetail({
      _user,
      orderId,
    });
    return handleResponse({ res, data: orderDetail });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.trackOrder = async (req, res) => {
  try {
    let {
      user: { _id: _user },
      params: { orderId },
      body: { trackId, website, name, comments },
    } = req;

    const trackOrder = await postTrackOrder({
      orderId,
      trackId,
      website,
      name,
      comments,
    });
    return handleResponse({ res, data: trackOrder });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.paymentStatus = async (req, res) => {
  try {
    let {
      user: { _id: _user },
      params: { orderId },
    } = req;

    const paymentStatus = await getPaymentStatus({
      orderId,
    });
    return handleResponse({ res, data: paymentStatus });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.orderReview = async (req, res) => {
  try {
    const _user = req.user;
    const { orderId } = req.params;
    const { rating, review } = req.body;
    const orderDetail = await getOrderDetail({
      _user,
      orderId,
    });
    if (!orderDetail) throw new Error('Order not found.');

    // if(orderDetail.result._buyer._id.toString() !== _user.toString()){
    //     return handleError(
    //         { res, err: 'You have not able to give a review.', statusCode: 401 }
    //       )
    // }

    const addReview = await putOrderReview({
      orderId,
      rating,
      review,
    });

    if (!addReview) throw new Error('Something went wrong.');

    return handleResponse({ res, msg: 'Review Sent Successfully.' });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.sellerReview = async (req, res) => {
  try {
    const _user = req.user;
    let {
      params: { userId },
      body: { rating, review },
    } = req;

    const sellerDetail = await getsellerDetail({
      _user,
      userId,
    });

    if (!sellerDetail) throw new Error('seller not found.');

    // if(sellerDetail._buyer._id.toString()!=_user){
    //     return handleError(
    //         { res, err: 'You have not able to give a review.', statusCode: 401 }
    //       )
    // }

    const addReview = await putsellerReview({
      userId,
      rating,
      review,
    });

    if (!addReview) throw new Error('Something went wrong.');

    return handleResponse({ res, msg: 'Success' });
  } catch (err) {
    return handleError({ res, err });
  }
};
