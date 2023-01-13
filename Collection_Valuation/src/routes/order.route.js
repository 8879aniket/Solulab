const express = require('express');
const router = express.Router();

const { buyOrderList,sellOrderList,orderDetail,orderReview ,trackOrder,sellerReview,paymentStatus} = require('../controller/order');

router.get('/buy', buyOrderList);
router.get('/sell', sellOrderList);
router.get('/detail/:orderId', orderDetail);
router.put('/review/:orderId', orderReview);
router.put('/sellerReview/:userId', sellerReview);
router.post('/track/:orderId', trackOrder);
 router.get('/paymentStatus/:orderId', paymentStatus);

module.exports = router;
