const _ = require('lodash');
const {
  handleResponse,
  handleError,
} = require('../../../common/middlewares/requestHandlers.js');

const Transaction = require('../../../models/transactionModel');
const User = require('../../../models/userModel');
const Order = require('../../../models/orderModel');

const { PayPalHelper } = require('../../../helpers/paypal.helper');

const { save: saveNotification } = require('../../../dbServices/notification');
const {
  notificationSettings: {
    notificationTypes,
    deliveryModesForNotificationTypes,
  },
} = require('../../../config/config');

async function SuccessCallbackPaymentForBuyCredit(req, res) {
  // const { user: __user } = req
  const { PayerID: payerId, paymentId, token: paypalToken } = req.query;

  const transaction = await Transaction.findOne({
    transactionId: paymentId,
    payUsing: 'paypal',
    action: 'BUY_CREDIT',
    'transactionMeta.paypalToken': paypalToken,
  });

  if (!transaction) {
    return handleError({
      statusCode: 422,
      err: 'No transaction found',
      res,
    });
  }

  const order = await Order.findById(transaction._order);

  if (!order) {
    return handleError({
      statusCode: 422,
      err: 'No order found',
      res,
    });
  }

  // Find the associated user
  const __user = await User.findOne({ _id: transaction.userId });
  if (!__user) throw new Error('Invalid user.');

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

  order.status = 'confirmed';
  await order.save();
  transaction.status = result.state;
  await transaction.save();

  // Sorry for the incorrect spelling, it is being used for long time, so correcting it might break things!
  const previousCreditCount = __user.creditCount ?? 0;
  __user.creditCount = previousCreditCount + order.orderMeta.creditCount;
  await __user.save();

  await saveNotification({
    notificationType: notificationTypes.PAYMENT_RECEIVED,
    deliveryModes:
      deliveryModesForNotificationTypes[notificationTypes.PAYMENT_RECEIVED],
    to: __user._id,
    metadata: {
      title: `Credit Payment Success`,
      body: `Your Payment for buy credit is successfully received, Total Amount : ${transaction.amount}`,
    },
    deliveryInfo: {
      email: __user.email,
      sms: __user.countryCode + __user.phone,
    },
  });

  if (transaction.transactionMeta.frontURL === '') {
    return handleResponse({
      statusCode: 201,
      msg: 'Adding credit successful.',
      res,
    });
  }
  return res.redirect(
    `${transaction.transactionMeta.frontURL}?transactionId=${transaction._id}`
  );
}

module.exports = SuccessCallbackPaymentForBuyCredit;
