const _ = require('lodash');
const {
  handleResponse,
  handleError,
} = require('../../../common/middlewares/requestHandlers.js');

const Transaction = require('../../../models/transactionModel');
const Order = require('../../../models/orderModel');
const User = require('../../../models/userModel');
const Coin = require('../../../models/coinModel');

const { PayPalHelper } = require('../../../helpers/paypal.helper');

const { save: saveNotification } = require('../../../dbServices/notification');
const {
  notificationSettings: {
    notificationTypes,
    deliveryModesForNotificationTypes,
  },
} = require('../../../config/config');

async function SuccessCallbackPaymentForBuyCoin(req, res) {
  // const { user: __user } = req
  const { PayerID: payerId, paymentId } = req.query;

  const transaction = await Transaction.findOne({
    transactionId: paymentId,
    payUsing: 'paypal',
  });

  if (!transaction) {
    return handleError({
      statusCode: 422,
      err: 'No transaction found',
      res,
    });
  }

  // Find the associated user
  const __user = await User.findOne({ _id: transaction.userId });
  const __coin = await Coin.findOne({ _id: transaction.transactionMeta._coin });
  if (!__user) throw new Error('Invalid user.');

  if (!__coin) throw new Error('Coin not found.');
  __coin.isSold = true;
  await __coin.save();

  const executePaymentJson = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: transaction.currency,
          total: transaction.amount,
        },
      },
    ],
  };

  const result = await PayPalHelper.ExecutePayment({
    paymentId,
    executePaymentJson,
  });

  if (result.httpStatusCode != 200) {
    return handleError({
      statusCode: result.response.httpStatusCode,
      err: result.response.message,
      res,
    });
  }

  transaction.status = result.state;
  await transaction.save();

  const order = await Order.findOne({
    _id: transaction._order,
  });

  if (!order) {
    return handleError({
      statusCode: 422,
      err: 'No order found',
      res,
    });
  }

  order.status = 'confirmed';
  await order.save();

  await saveNotification({
    notificationType: notificationTypes.PAYMENT_RECEIVED,
    deliveryModes:
      deliveryModesForNotificationTypes[notificationTypes.PAYMENT_RECEIVED],
    to: __user._id,
    metadata: {
      title: `Coin Payment Success`,
      body: `Your Payment for buy Coin is successfully received, Total Amount : ${transaction.amount}`,
    },
    deliveryInfo: {
      email: __user.email,
      sms: __user.countryCode + __user.phone,
    },
  });

  if (transaction.transactionMeta.frontURL === '') {
    return handleResponse({
      statusCode: 201,
      msg: 'Buy Coin Success.',
      res,
    });
  }
  return res.redirect(
    `${transaction.transactionMeta.frontURL}?transactionId=${transaction._id}`
  );
}

module.exports = SuccessCallbackPaymentForBuyCoin;
