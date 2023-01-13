const express = require('express');
const { validate } = require('express-jsonschema');
const { Wrap } = require('../common/utils/util');

const PaymentGatewayController = require('../controller/payment-gateway');

const router = express.Router();

router.all(
  '/callback',
  Wrap((req, res) => {
    const { gateway, type, action } = req.query;

    if (gateway == 'paypal') {
      if (action == 'cancel') {
        // Handle Cancelled transactions
        switch (type) {
          case 'buyCredits':
            return Wrap(
              PaymentGatewayController.CancelCallbackPaymentForAddCredits(
                req,
                res
              )
            );
          case 'buyCoin':
            return Wrap(
              PaymentGatewayController.CancelCallbackPaymentForBuyCoin(req, res)
            );
        }
      } else {
        // Handle Success transactions
        switch (type) {
          case 'buyCredits':
            return Wrap(
              PaymentGatewayController.SuccessCallbackPaymentForAddCredits(
                req,
                res
              )
            );
          case 'buyCoin':
            return Wrap(
              PaymentGatewayController.SuccessCallbackPaymentForBuyCoin(
                req,
                res
              )
            );
        }
      }
    }
  })
);

router.all(
  '/',
  Wrap((req, res) => {
    const { gateway, type } = req.query;

    // Handle transactions via internal payments
    if (gateway == 'internal') {
      // Handle Cancelled transactions
      switch (type) {
        case 'buyVipMembership':
          return Wrap(
            PaymentGatewayController.InitPaymentForBecomeVIPMember(req, res)
          );
      }
    }

    // Handle transactions via Paypal
    if (gateway == 'paypal') {
      switch (type) {
        case 'buyCredits':
          return Wrap(
            PaymentGatewayController.InitPaymentForAddCredits(req, res)
          );
        case 'buyCoin':
          return Wrap(PaymentGatewayController.InitPaymentForBuyCoin(req, res));
      }
    }
  })
);

module.exports = router;
