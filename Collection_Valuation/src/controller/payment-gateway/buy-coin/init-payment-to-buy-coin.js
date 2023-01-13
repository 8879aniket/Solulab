const _ = require('lodash');
const {
  handleResponse,
  handleError,
} = require('../../../common/middlewares/requestHandlers.js');

const { PayPalHelper } = require('../../../helpers/paypal.helper');

const { getWithMultipleFields, get } = require('../../../dbServices/users');

const Transaction = require('../../../models/transactionModel');
const Order = require('../../../models/orderModel');

async function InitPaymentToBuyCoin(req, res, coin, order) {
  const { _id } = req.query;
  let { frontURL } = req.query;
  let __user = await get(_id);

  if (!frontURL) {
    frontURL = '';
  }

  if (!__user) {
    __user = await getWithMultipleFields({ _id: _id });
  }

  if (!__user) throw new Error('Invalid user.');

  const action = 'BUY_COIN';
  const name = coin.name;
  const sku = 'Buy Coin';
  const price = coin.price;
  const currency = 'USD';
  const description = 'Buy Coin';

  if (price === 0) {
    throw new Error('Coins price is invalid');
  }

  // Init the payment process

  const itemList = [{ name, sku, price }];

  const callbackUrl = `${req.secure ? 'https://' : 'http://'}${
    req.headers.host
  }/api/v1/pay/callback?type=buyCoin`;

  const redirectURL = req.body.redirectURL;
  var sess = req.session;
  sess.url = redirectURL;

  const payment = await PayPalHelper.CreatePayment({
    currency,
    itemList,
    description,
    returnUrl: callbackUrl,
  });

  const totalPrice = itemList.reduce((result, e) => {
    return result + e.price * e.quantity;
  }, 0);

  // Create a Transaction record
  const transaction = await Transaction({
    userId: __user._id,
    transactionId: payment.id,
    action,
    _order: order._id,
    amount: totalPrice,
    currency,
    status: 'pending',
    payUsing: 'paypal',
    description,
    transactionMeta: {
      _coin: coin._id,
      _order: order._id,
      frontURL,
    },
  });

  // Save transaction
  await transaction.save();

  for (let i = 0; i < payment.links.length; i++) {
    if (payment.links[i].rel === 'approval_url') {
      return res.redirect(payment.links[i].href);
    }
  }
}

module.exports = InitPaymentToBuyCoin;
