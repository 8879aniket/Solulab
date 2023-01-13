const paypal = require('paypal-rest-sdk');
const _ = require('lodash');
const config = require('../config/config');

const PayPalHelper = {
  init(options) {
    paypal.configure({
      mode: config.PAYPAL.PAYPAL_MODE, //sandbox or live
      client_id: config.PAYPAL.PAYPAL_KEY,
      client_secret: config.PAYPAL.PAYPAL_SECRET,
      // client_id': 'AerLIPoUS9u7cIAfli4wkZv - FgP - FVWwZcqxkK59ZTfJScuX0a2MkUgr5ODFgnWKwQD3Ft - _nBvrVesY',
      // 'client_secret': 'EEjlVTfYGNXV8KFIX9atDm-aLmRBa1PjkAu8JpZ92dRDeDv6B5J6vAEs0QMOKm2rgiOd6_AeTM1f8IFu'
    });
  },

  async CreatePayment(options) {
    const {
      currency,
      itemList: item_list,
      description = 'No description provided.',
      returnUrl: return_url,
    } = options;
    try {
      if (!_.isArray(item_list)) {
        throw 'item_list need to be an array.';
      }

      // Assign the currency to the Items
      item_list.map((e) => {
        e.currency = currency;
      });

      // Find the total values for all the Items
      const totalPrice = item_list.reduce((result, e) => {
        e.quantity = e.quantity ?? 1;
        return result + e.price * e.quantity;
      }, 0);

      const URL_CONNECTOR = return_url.indexOf('?') == -1 ? '?' : '&';

      const promise = new Promise(function (resolve, reject) {
        const create_payment_json = {
          intent: 'sale',
          payer: {
            payment_method: 'paypal',
          },
          redirect_urls: {
            return_url: `${return_url}${URL_CONNECTOR}gateway=paypal`,
            cancel_url: `${return_url}${URL_CONNECTOR}gateway=paypal&action=cancel`,
          },
          transactions: [
            {
              item_list: {
                items: item_list,
              },
              amount: {
                currency,
                total: totalPrice,
              },
              description,
            },
          ],
        };
        paypal.payment.create(create_payment_json, function (error, payment) {
          if (error) {
            // throw error;
            reject(error);
          } else {
            resolve(payment);
          }
        });
      });

      return await promise.then((result) => result).catch((error) => error);
    } catch (error) {
      throw error;
    }
  },

  async ExecutePayment(options) {
    try {
      const { paymentId, executePaymentJson: execute_payment_json } = options;

      // Obtains the transaction details from paypal
      const promise = new Promise(function (resolve, reject) {
        paypal.payment.execute(
          paymentId,
          execute_payment_json,
          function (error, payment) {
            if (error) {
              return reject(error);
            } else {
              return resolve(payment);
            }
          }
        );
      });

      const result = await promise
        .then((result) => result)
        .catch((error) => error);

      return result;
    } catch (error) {
      throw error;
    }
  },

  async CreateWebhook(options) {
    try {
      const promise = new Promise(function (resolve, reject) {
        var create_webhook_json = {
          url: config.PAYPAL.PAYPAL_WEBHOOK_URL,
          event_types: [
            {
              name: 'PAYMENT.AUTHORIZATION.CREATED',
            },
            {
              name: 'PAYMENT.AUTHORIZATION.VOIDED',
            },
            {
              name: 'PAYMENT.CAPTURE.COMPLETED',
            },
            {
              name: 'PAYMENT.CAPTURE.DENIED',
            },
            {
              name: 'PAYMENT.CAPTURE.PENDING',
            },
            {
              name: 'PAYMENT.CAPTURE.REFUNDED',
            },
            {
              name: 'PAYMENT.CAPTURE.REVERSED',
            },
            {
              name: 'PAYMENT.SALE.COMPLETED',
            },
            {
              name: 'PAYMENT.SALE.DENIED',
            },
          ],
        };
        paypal.notification.webhook.create(
          create_webhook_json,
          (error, webhook) => {
            if (error) {
              return reject(error);
            } else {
              return resolve(webhook);
            }
          }
        );
      });

      const data = await promise
        .then((result) => result)
        .then((data) => data)
        .catch((error) => error);

      return data;
    } catch (error) {
      throw error;
    }
  },

  async DeleteWebhook() {
    try {
      const promise = new Promise(function (resolve, reject) {
        var webhookId = '6RY06016VL0286427';
        paypal.notification.webhook.del(webhookId, (error, response) => {
          if (error) {
            return reject(error);
          } else {
            return resolve(response);
          }
        });
      });

      const data = await promise
        .then((result) => result)
        .then((data) => data)
        .catch((error) => error);

      return data;
    } catch (error) {
      throw error;
    }
  },
};

// All Done
PayPalHelper.init();
module.exports.PayPalHelper = PayPalHelper;
