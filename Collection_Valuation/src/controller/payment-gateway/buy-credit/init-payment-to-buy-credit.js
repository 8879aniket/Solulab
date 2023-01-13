const _ = require('lodash');
var UrlParse = require('url-parse');
const {
  handleResponse,
  handleError,
} = require('../../../common/middlewares/requestHandlers.js');

const { PayPalHelper } = require('../../../helpers/paypal.helper');

const { getWithMultipleFields } = require('../../../dbServices/users');

const Transaction = require('../../../models/transactionModel');
const Order = require('../../../models/orderModel');
const VIP = require('../../../models/vipModel');

async function InitPaymentToBuyCredit(req, res) {
  // const { user: __user } = req
  //const { user: _userId = '61277026d50db331a82f5005' } = req.query;

  let { _userId } = req.query;
  let { user: __user } = req;
  let { creditCount = 10 } = req.query;
  let { frontURL } = req.query;

  if (!frontURL) {
    frontURL = '';
  }

  // TODO: Just for testing purpose, Will remove it later
  // TODO: make __user as const variable later on
  if (!__user) {
    __user = await getWithMultipleFields({ _id: _userId });
  }

  if (!__user) throw new Error('Invalid user.');

  // Convert Credits to USD [ 1 Credit = 1 USD ]
  const usdPricePerCredit = 1;
  let price;

  // Benefit in credit for VIP Member
  if (__user.isVIPMemeber) {
    const vipData = await VIP.findOne();
    price = Number(
      ((usdPricePerCredit * creditCount) / vipData.creditValue).toFixed(2)
    );
  } else {
    price = Number(((usdPricePerCredit * creditCount) / 2).toFixed(2));
  }

  const action = 'BUY_CREDIT';
  const name = 'Buy Credit';
  const sku = 'BUY_CREDIT';
  const currency = 'USD';
  const description = 'Buy Credit';

  // Init the payment process

  const itemList = [{ name, sku, price }];

  const callbackUrl = `${req.secure ? 'https://' : 'http://'}${
    req.headers.host
  }/api/v1/pay/callback?type=buyCredits`;

  const payment = await PayPalHelper.CreatePayment({
    currency,
    itemList,
    description,
    returnUrl: callbackUrl,
  });

  const totalPrice = itemList.reduce((result, e) => {
    return result + e.price * e.quantity;
  }, 0);

  let redirectURL = null;
  for (let i = 0; i < payment.links.length; i++) {
    if (payment.links[i].rel === 'approval_url') {
      redirectURL = payment.links[i].href;
    }
  }

  let paypalToken = null;
  const parsedUrl = UrlParse(redirectURL);
  const queryParamsArray = parsedUrl.query.replace('?', '').split('&');
  for (let i = 0; i < queryParamsArray.length; i++) {
    const elem = queryParamsArray[i];
    if (elem.indexOf('token=') == 0) {
      paypalToken = elem.split('=')[1];
    }
  }

  const order = await Order({
    _buyer: __user._id,
    status: 'paymentInProgress',
    orderType: 'addCredit',
    orderMeta: {
      creditCount,
    },
  });

  // Save Order
  await order.save();

  // Create a Transaction record
  const transaction = await Transaction({
    userId: __user._id,
    transactionId: payment.id,
    action,
    amount: totalPrice,
    currency,
    status: payment.state,
    payUsing: 'paypal',
    description,
    _order: order._id,
    transactionMeta: {
      creditCount,
      paypalToken,
      frontURL,
    },
  });
  // Save order
  order._transaction = transaction._id;
  await order.save();

  // Save transaction
  await transaction.save();

  return res.redirect(redirectURL);
}

module.exports = InitPaymentToBuyCredit;
