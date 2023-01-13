const _InitPaymentForBecomeVIPMember = require('./vip-membership/init-payment-to-become-vip-member')
const _InitPaymentForBuyCoin = require('./buy-coin/init-payment-to-buy-coin')
const _SuccessCallbackPaymentForBuyCoin = require('./buy-coin/success-callback-payment-to-buy-coin')
const _CancelCallbackPaymentForBuyCoin = require('./buy-coin/cancel-callback-payment-to-buy-coin')

const _InitPaymentForAddCredits = require('./buy-credit/init-payment-to-buy-credit')
const _SuccessCallbackPaymentForAddCredits = require('./buy-credit/success-callback-payment-to-buy-credit')
const _CancelCallbackPaymentForAddCredits = require('./buy-credit/cancel-callback-payment-to-buy-credit')

module.exports = {
  InitPaymentForAddCredits: _InitPaymentForAddCredits,
  SuccessCallbackPaymentForAddCredits: _SuccessCallbackPaymentForAddCredits,
  CancelCallbackPaymentForAddCredits: _CancelCallbackPaymentForAddCredits,

  // for buy coin
  InitPaymentForBuyCoin : _InitPaymentForBuyCoin,
  SuccessCallbackPaymentForBuyCoin : _SuccessCallbackPaymentForBuyCoin,
  CancelCallbackPaymentForBuyCoin : _CancelCallbackPaymentForBuyCoin,

  InitPaymentForBecomeVIPMember: _InitPaymentForBecomeVIPMember,
}
