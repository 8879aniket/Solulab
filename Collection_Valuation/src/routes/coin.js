const express = require('express');
const router = express.Router();

const { uploadS3 } = require('../helpers/s3.helper');

const {
  addCoin,
  myPortfolio,
  coinDetails,
  addCoinToWishList,
  removeCoinToWishList,
  getWishList,
  coinList,
  buyCoin,
  deleteCoin,
  ClassifyCoin,
  CoinGrade,
  getMessage,
  addContactUsMessage,
  getGradeCoinList,
  generateGradingReport,
} = require('../controller/coin');

// Coin
router.post(
  '/',
  uploadS3.fields([
    { name: 'frontSideImage', maxCount: 1 },
    { name: 'backSideSideImage', maxCount: 1 },
    { name: 'othersImage', maxCount: 1 },
  ]),
  addCoin
);
router.post(
  '/classify-coin',
  uploadS3.fields([
    { name: 'frontSideImage', maxCount: 1 },
    { name: 'backSideSideImage', maxCount: 1 },
  ]),
  ClassifyCoin
);

router.post('/coin-grade', CoinGrade);

router.get('/my-portfolio', myPortfolio);
router.get('/coin-details/:coinId', coinDetails);
router.delete('/delete/:coinId', deleteCoin);
router.get('/wish-list', getWishList);
router.post('/wish-list', addCoinToWishList);
router.delete('/wish-list/:coinId', removeCoinToWishList);
router.get('/list', coinList);
router.get('/buy-coin', buyCoin);
router.get('/contact-us', getMessage);
router.post('/contact-us', addContactUsMessage);
router.get('/getGradeCoinList', getGradeCoinList);
router.get('/generateGradingReport/:coinId', generateGradingReport);

module.exports = router;
