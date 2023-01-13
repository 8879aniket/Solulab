const express = require('express');
const router = express.Router();

const {
  socialLogin,
  socialLoginCallback
} = require('../controller/auth');

// Auth
router.get('/login/social/:oauthProvider', socialLogin);
router.get('/login/social/:oauthProvider/callback', socialLoginCallback);


module.exports = router;
