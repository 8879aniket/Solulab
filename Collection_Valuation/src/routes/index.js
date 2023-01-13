const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../common/middlewares/authCheck');

const { verifyEmail } = require('../controller/users');

const users = require('./users');
const order = require('./order.route');
const coin = require('./coin');
const auction = require('./auction');
const conversationRouter = require('./conversation.route');
const paymentGatewayRouter = require('./payment-gateway.route');
const webhook = require('./webhook');
const VIP = require('../models/vipModel');

router.get('/verify-email/:link', verifyEmail);

// NOT IN USE
// const auth = require('./auth.route');
// router.use('/auth', auth);

router.use(isAuthenticated);

router.use('/users', users);
router.use('/coin', coin);
router.use('/auction', auction);
router.use('/conversations', conversationRouter);
router.use('/pay', paymentGatewayRouter);
router.use('/order', order);
// router.use('/paypal', webhook);
// router.use('/vip', async (req, res) => {
//   const vipData = await VIP.create({ ...req.body });
//   return res.send(vipData);
// });

module.exports = router;
