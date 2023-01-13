const _ = require('lodash');
const { v4: uuidv4 } = require('uuid');
const {
  handleResponse,
  handleError,
} = require('../../../common/middlewares/requestHandlers.js');

const { getWithMultipleFields } = require('../../../dbServices/users');

const Transaction = require('../../../models/transactionModel');
const Order = require('../../../models/orderModel');
const VIP = require('../../../models/vipModel');
const { save: saveNotification } = require('../../../dbServices/notification');
const {
  notificationSettings: {
    notificationTypes,
    deliveryModesForNotificationTypes,
  },
} = require('../../../config/config');

async function InitPaymentToBecomeVIPMember(req, res) {
  const priceInCredits = 10;

  // const { user: __user } = req
  //const { user: _userId = "61277026d50db331a82f5005" } = req.query;
  const { _userId } = req.query;

  let { user: __user } = req;

  // TODO: Just for testing purpose, Will remove it later
  // TODO: make __user as const variable later on
  if (!__user) {
    __user = await getWithMultipleFields({ _id: _userId });
  }

  if (!__user) throw new Error('Invalid user.');

  if (__user.isVIPMemeber) {
    return handleError({
      statusCode: 400,
      err: 'You are already a VIP member.',
      res,
    });
  }

  const vipData = await VIP.findOne();
  if (!__user.creditCount && __user.creditCount < vipData.vipPrice) {
    return handleError({
      statusCode: 400,
      err: 'Insufficient credit balance.',
      res,
    });
  }

  __user.creditCount = __user.creditCount - vipData.vipPrice;
  // Adding Bonus credit while becoming VIP member
  __user.creditCount = __user.creditCount + vipData.creditBonus;
  __user.isVIPMemeber = true;
  // Start and End Date of Membership
  __user.vipMemberStartDate = Date.now();
  const date = new Date();
  __user.vipMemberEndDate = date.setMonth(date.getMonth() + 1);
  await __user.save();

  const action = 'buyVipMembership';
  const currency = 'credit';

  const order = await Order({
    _buyer: __user._id,
    status: 'confirmed',
    orderType: 'buyVipMembership',
  });

  // Save Order
  await order.save();

  // Create a Transaction record
  const transaction = await Transaction({
    userId: __user._id,
    transactionId: `VIA-CREDIT-${uuidv4()}`,
    action,
    amount: priceInCredits,
    currency,
    status: 'approved',
    payUsing: 'internal',
    description: 'Purchase of VIP membership with platform credit.',
    _order: order._id,
    transactionMeta: {
      creditCount: vipData.vipPrice,
    },
  });

  // Save order
  order._transaction = transaction._id;
  await order.save();

  // Save transaction
  await transaction.save();

  //notification
  await saveNotification({
    notificationType: notificationTypes.VIP_MEMBERSHIP_ACQUIRED,
    deliveryModes:
      deliveryModesForNotificationTypes[
        notificationTypes.VIP_MEMBERSHIP_ACQUIRED
      ],
    to: __user._id,
    metadata: {
      title: `VIP Membership`,
      body: `You are upgraded to VIP Member`,
    },
    deliveryInfo: {
      email: __user.email,
      sms: __user.countryCode + __user.phone,
    },
  });

  return handleResponse({
    res,
    statusCode: 201,
    msg: 'VIP membership purchased successfully.',
  });
}

module.exports = InitPaymentToBecomeVIPMember;
