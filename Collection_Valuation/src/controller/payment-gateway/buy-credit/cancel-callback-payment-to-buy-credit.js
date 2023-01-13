const _ = require('lodash');
const {
  handleResponse,
  handleError,
} = require('../../../common/middlewares/requestHandlers.js');

const Transaction = require('../../../models/transactionModel');
const User = require('../../../models/userModel');
const Order = require('../../../models/orderModel');
const { save: saveNotification } = require('../../../dbServices/notification');
const {
  notificationSettings: {
    notificationTypes,
    deliveryModesForNotificationTypes,
  },
} = require('../../../config/config');

async function CancelCallbackPaymentForBuyCredit(req, res) {
  const { token: paypalToken } = req.query;

  const transaction = await Transaction.findOne({
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

  order.status = 'cancelled';
  await order.save();
  transaction.status = 'cancelled';
  await transaction.save();

  const __user = await User.findOne({ _id: transaction.userId });
  if (!__user) throw new Error('Invalid user.');

  await saveNotification({
    notificationType: notificationTypes.PAYMENT_RECEIVED,
    deliveryModes:
      deliveryModesForNotificationTypes[notificationTypes.PAYMENT_RECEIVED],
    to: __user._id,
    metadata: {
      title: `Credit Payment Failed`,
      body: `Your Payment for buy credit is Failed, Total Amount : ${transaction.amount}`,
    },
    deliveryInfo: {
      email: __user.email,
      sms: __user.countryCode + __user.phone,
    },
  });

  if (transaction.transactionMeta.frontURL === '') {
    return res.send('cancelled');
  }
  return res.redirect(
    `${transaction.transactionMeta.frontURL}?transactionId=${transaction._id}`
  );
  //res.send('cancelled');
}

module.exports = CancelCallbackPaymentForBuyCredit;
