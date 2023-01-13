const express = require('express');
const router = express.Router();

const { webhook } = require('../controller/payment-gateway/webhook');

router.post('/webhook', webhook);

module.exports = router;
