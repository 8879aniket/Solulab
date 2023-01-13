const _ = require('lodash');
const moment = require('moment');
const fs = require('fs');
const pdf = require('html-pdf');
const path = require('path');
const Transaction = require('../models/transactionModel');
const Coin = require('../models/coinModel');
const Order = require('../models/orderModel');
const { ObjectId } = require('mongoose').Types;
const PaymentGatewayController = require('../controller/payment-gateway');
const Config = require('../config/config');
const MLResponseModel = require('../models/mlResponse.model');
const AgendaHelper = require('../helpers/agenda.helper');
const puppeteer = require('puppeteer');

const {
  handleResponse,
  handleError,
} = require('../common/middlewares/requestHandlers');

const { S3ExtractMeta, deleteFromS3 } = require('../helpers/s3.helper');

const {
  Model: CoinModel,
  save,
  myPortfolio,
  coinDetails,
  get,
  update,
  addCoinToWishList,
  getMessage,
  addMessage,
  removeCoinToWishList,
  getWishList,
  getCoinList,
  getRelatedCoins,
  getGradeCoinList,
} = require('../dbServices/coin');
const OrderModel = require('../models/orderModel');
const TransactionModel = require('../models/transactionModel');

const { v4: uuidv4 } = require('uuid');

const { wishListRemovedError } = require('../messages/error');

const {
  coinAdded,
  wishListAdded,
  wishListRemoved,
  coinSold,
  MessgaeAdded,
} = require('../messages/success');

module.exports.addCoin = async (req, res) => {
  try {
    const { user: __user } = req;
    const {
      name,
      history,
      ruler,
      tags,
      type,
      material,
      shape,
      country,
      _mlReference,
    } = req.body;

    let { isCoin = 'true', weight, price, diameter, age, thickness } = req.body;
    if (weight) weight = weight.split(' ')[0];
    if (diameter) diameter = diameter.split(' ')[0];

    isCoin = isCoin.trim().toLowerCase() == 'true' ? true : false;
    thickness = !isNaN(thickness) ? parseFloat(thickness.trim()) : 0;
    weight = !isNaN(weight) ? parseFloat(weight.trim()) : 0;
    price = !isNaN(price) ? parseFloat(price.trim()) : 0;
    diameter = !isNaN(diameter) ? parseFloat(diameter.trim()) : 0;
    age = !isNaN(age) ? parseFloat(age.trim()) : 0;
    year = age ? moment().year() - age : 0;

    if (isCoin == 'true') {
      isCoin = true;
    }
    const {
      files: { frontSideImage, backSideSideImage, othersImage },
    } = req;

    let FRONT_SIDE_IMAGE = null;
    let BACK_SIDE_IMAGE = null;
    let OTHER_IMAGE = null;

    if (_mlReference) {
      const mLResponse = await MLResponseModel.findOne({
        _id: _mlReference,
        type: 'classification',
      });

      if (!mLResponse) {
        return handleError({
          statusCode: 400,
          res,
          err: '_mlReference is invalid.',
        });
      }

      FRONT_SIDE_IMAGE = mLResponse.mlMetadata.images.FRONT_SIDE_IMAGE;
      BACK_SIDE_IMAGE = mLResponse.mlMetadata.images.BACK_SIDE_IMAGE;
    } else {
      FRONT_SIDE_IMAGE = S3ExtractMeta(frontSideImage);
      BACK_SIDE_IMAGE = S3ExtractMeta(backSideSideImage);
      OTHER_IMAGE = S3ExtractMeta(othersImage);

      if (FRONT_SIDE_IMAGE.length) {
        FRONT_SIDE_IMAGE = {
          key: FRONT_SIDE_IMAGE[0].key,
          url: FRONT_SIDE_IMAGE[0].location,
          sizeInMegaByte: FRONT_SIDE_IMAGE[0].size / 1024 ** 2,
        };
      }
      if (BACK_SIDE_IMAGE.length) {
        BACK_SIDE_IMAGE = {
          key: BACK_SIDE_IMAGE[0].key,
          url: BACK_SIDE_IMAGE[0].location,
          sizeInMegaByte: BACK_SIDE_IMAGE[0].size / 1024 ** 2,
        };
      }
      if (OTHER_IMAGE.length) {
        OTHER_IMAGE = {
          key: OTHER_IMAGE[0].key,
          url: OTHER_IMAGE[0].location,
          sizeInMegaByte: OTHER_IMAGE[0].size / 1024 ** 2,
        };
      }
    }

    const coin = await save({
      userId: __user._id,
      name,
      history,
      price,
      material,
      shape,
      country,
      thickness,
      type,
      diameter,
      weight,
      ruler,
      age,
      year,
      tags,
      isCoin,
      pictures: {
        front: FRONT_SIDE_IMAGE,
        back: BACK_SIDE_IMAGE,
        other: OTHER_IMAGE,
      },
    });
    return handleResponse({ res, msg: coinAdded, data: coin });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.myPortfolio = async (
  { user: { _id }, query: { skip, limit } },
  res
) => {
  try {
    const coins = await myPortfolio(_id, +skip || 0, +limit || 10);
    return handleResponse({ res, data: coins });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.coinDetails = async (
  { user: { _id }, params: { coinId } },
  res
) => {
  try {
    const coins = await coinDetails(coinId, _id);
    if (!coins.userData) {
      return handleError({
        res,
        err: 'Owner id not found.',
      });
    }

    // Dummy Code Start
    const auctionTime = new Date(new Date().getTime() + 60000 * 1);
    const currentDate = new Date();
    await AgendaHelper.Get().schedule(currentDate, 'AUCTION_END', {
      _coin: coins._id,
      coin: coins,
    });

    const relatedCoins = await getRelatedCoins(
      coinId,
      coins.userData.country,
      coins.age,
      coins.year,
      coins.material
    );
    coins.relatedCoins = relatedCoins.list;
    return handleResponse({ res, data: coins });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.addCoinToWishList = async (req, res) => {
  try {
    const { body } = req;
    const { user: __user } = req;
    const userId = __user._id;
    const { coinId } = body;
    const wishList = await addCoinToWishList({
      userId,
      coinId,
    });
    return handleResponse({ res, data: wishList, msg: wishListAdded });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.addContactUsMessage = async (req, res) => {
  try {
    const { body } = req;
    const { user: __user } = req;
    const userId = __user._id;
    const { message } = body;
    if (message == '') {
      return handleResponse({ res, msg: 'Message cannot be empty' });
    }

    const ContactUs = await addMessage({
      userId,
      message,
    });
    return handleResponse({ res, data: ContactUs, msg: MessgaeAdded });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.removeCoinToWishList = async (
  { user: { _id: userId }, params: { coinId } },
  res
) => {
  try {
    const wishList = await removeCoinToWishList(userId, coinId);
    if (wishList.deletedCount > 0) {
      return handleResponse({ res, msg: wishListRemoved });
    }
    return handleResponse({ res, msg: wishListRemovedError, result: 0 });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.getWishList = async (
  { user: { _id }, query: { skip, limit } },
  res
) => {
  try {
    const wishList = await getWishList(_id, +skip || 0, +limit || 10);
    return handleResponse({ res, data: wishList });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.getMessage = async (
  { user: { _id }, query: { skip, limit } },
  res
) => {
  try {
    const Message = await getMessage(_id, +skip || 0, +limit || 10);
    return handleResponse({ res, data: Message });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.coinList = async (req, res) => {
  try {
    let {
      user: { _id, country: userCountry },
      query: {
        country,
        grading,
        isGraded,
        isSold,
        marketPlaceState,
        shape,
        material,
        fromYear,
        toYear,
        fromPrice,
        toPrice,
        isCoin,
        sortPrice,
        sortName,
        search,
        startIndex,
        itemsPerPage,
      },
    } = req;

    // const country = filterCountry;
    // if (filterCountry) {
    //   country = filterCountry;
    // }

    fromYear = fromYear ? parseFloat(fromYear) : undefined;
    sortPrice = sortPrice ? parseInt(sortPrice) : undefined;
    toYear = toYear ? parseFloat(toYear) : undefined;
    fromPrice = fromPrice ? parseFloat(fromPrice) : undefined;
    isCoin = isCoin ? (isCoin.trim() == 'true' ? true : false) : undefined;
    isGraded = isGraded
      ? isGraded.trim() == 'true'
        ? true
        : false
      : undefined;
    isSold = isSold ? (isSold.trim() == 'true' ? true : false) : undefined;

    // const coinList = await getCoinList(_id, country, grading, shape, material, fromYear, toYear, fromPrice, toPrice, sortPrice, search, coinType, +skip || 0, +limit || 10);
    const coinList = await getCoinList({
      _id,
      country,
      grading,
      isGraded,
      isSold,
      marketPlaceState,
      shape,
      material,
      fromYear: +fromYear,
      toYear: +toYear,
      fromPrice: +fromPrice,
      toPrice: +toPrice,
      sortPrice: +sortPrice,
      sortName,
      search,
      isCoin,
      startIndex: +startIndex,
      itemsPerPage: +itemsPerPage,
    });
    if (coinList !== undefined) {
      coinList.list = coinList.items;
    }
    delete coinList.items;
    return handleResponse({ res, data: coinList });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.buyCoin = async (req, res) => {
  try {
    let {
      query: { coinId, addressId },
    } = req;
    let {
      query: { _id },
    } = req;
    const coin = await Coin.findOne({ _id: coinId });
    if (!coin) throw new Error('Coin not found.');

    let before_1_hours = moment().add(-1, 'hours').toISOString();
    let before_1_hours_isoDate = new Date(before_1_hours);
    if (coin.isSold == true) {
      return handleResponse({ res, msg: coinSold });
    } else {
      const transaction_data = await Transaction.findOne({
        action: 'BUY_COIN',
        status: 'pending',
        'transactionMeta._coin': ObjectId(coinId),
      });
      if (transaction_data) {
        if (transaction_data.createdAt < before_1_hours_isoDate) {
          // update status to cancelled and proceed
          var test = await Transaction.updateOne(
            {
              _id: transaction_data._id,
            },
            { status: 'cancelled' }
          );
        } else {
          // Coin is already sold
          return handleResponse({ res, msg: coinSold });
        }
      }

      // Create a order record
      const order = await Order({
        _buyer: _id,
        _seller: coin.userId,
        _coin: coin._id,
        deliveryAddress: addressId,
        status: 'placed',
        orderType: 'coinSale',
      });
      await order.save();

      // Redirect to paypal
      let initPayment = await PaymentGatewayController.InitPaymentForBuyCoin(
        req,
        res,
        coin,
        order
      );
      //return handleResponse({ initPayment, msg: 'all process complete' });
    }
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.deleteCoin = async (
  { user: { _id: userId }, params: { coinId } },
  res
) => {
  try {
    const coins = await get(coinId);

    if (!coins) {
      return handleError({
        res,
        err: 'Coin not found.',
      });
    }

    if (coins.userId.toString() != userId) {
      return handleError({
        res,
        err: 'Owner not found.',
      });
    }

    if (coins.isSold) {
      return handleError({
        res,
        err: `Coins sold can't be deleted.`,
      });
    } else {
      await coins.deleteOne();

      return handleResponse({
        res,
        msg: 'Coin successfully deleted.',
      });
    }
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.ClassifyCoin = async (req, res) => {
  try {
    const { user: __user } = req;

    const {
      files: { frontSideImage, backSideSideImage },
    } = req;

    let FRONT_SIDE_IMAGE = S3ExtractMeta(frontSideImage);
    let BACK_SIDE_IMAGE = S3ExtractMeta(backSideSideImage);

    if (FRONT_SIDE_IMAGE.length) {
      FRONT_SIDE_IMAGE = {
        key: FRONT_SIDE_IMAGE[0].key,
        url: FRONT_SIDE_IMAGE[0].location,
        sizeInMegaByte: FRONT_SIDE_IMAGE[0].size / 1024 ** 2,
      };
    }
    if (BACK_SIDE_IMAGE.length) {
      BACK_SIDE_IMAGE = {
        key: BACK_SIDE_IMAGE[0].key,
        url: BACK_SIDE_IMAGE[0].location,
        sizeInMegaByte: BACK_SIDE_IMAGE[0].size / 1024 ** 2,
      };
    }

    const execSync = require('child_process').execSync;
    const mlMetadata = execSync(
      `${Config.PYTHON.COIN_CLASSIFICATION_COMMAND} --URL_Front "${FRONT_SIDE_IMAGE.url}" --URL_Back "${BACK_SIDE_IMAGE.url}"`
    );

    const mlMetadataParsed = JSON.parse(
      mlMetadata.toString().replace(/'/g, '"')
    );

    // Save to DB
    const mLResponseModel = new MLResponseModel({
      mlMetadata: {
        mlResponse: mlMetadataParsed,
        images: {
          FRONT_SIDE_IMAGE,
          BACK_SIDE_IMAGE,
        },
      },
      type: 'classification',
    });
    await mLResponseModel.save();

    const mLResponseModelJSON = mLResponseModel.toJSON();
    mLResponseModelJSON._mlReference = mLResponseModelJSON._id;
    delete mLResponseModelJSON._id;

    if (mlMetadataParsed.Error != '') {
      return handleError({
        res,
        err: mlMetadataParsed.Error,
        data: mLResponseModelJSON,
      });
    }

    return handleResponse({
      res,
      data: mLResponseModelJSON,
    });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.CoinGrade = async (req, res) => {
  try {
    const CREDIT_FEE_FOR_GRADING = 2;

    const { user: __user, body } = req;
    const { coinId } = body;

    const coin = await Coin.findOne({
      _id: coinId,
      userId: __user._id,
    });

    if (!coin) {
      return handleError({
        res,
        statusCode: 400,
        err: 'No coins found',
      });
    }

    if (!__user.creditCount || __user.creditCount < CREDIT_FEE_FOR_GRADING) {
      return handleError({
        statusCode: 400,
        err: 'Insufficient credit balance.',
        res,
      });
    }

    let FRONT_SIDE_IMAGE = coin.pictures.front;
    let BACK_SIDE_IMAGE = coin.pictures.back;

    const execSync = require('child_process').execSync;
    const mlMetadata = execSync(
      `${Config.PYTHON.COIN_GRADING_COMMAND} --URL_Front "${FRONT_SIDE_IMAGE.url}" --URL_Back "${BACK_SIDE_IMAGE.url}"`
    );

    const mlMetadataParsed = JSON.parse(
      mlMetadata.toString().replace(/'/g, '"')
    );

    // Save to DB
    const mLResponseModel = new MLResponseModel({
      mlMetadata: {
        mlResponse: mlMetadataParsed,
        images: {
          FRONT_SIDE_IMAGE,
          BACK_SIDE_IMAGE,
        },
      },
      type: 'grading',
    });
    await mLResponseModel.save();

    const mLResponseModelJSON = mLResponseModel.toJSON();
    mLResponseModelJSON._mlReference = mLResponseModelJSON._id;
    delete mLResponseModelJSON._id;

    // Create Order
    const order = await OrderModel({
      _buyer: __user._id,
      _coin: coin._id,
      orderType: 'coinGrading',
    });
    await order.save();

    if (mlMetadataParsed.Error != '') {
      order.status = 'failed';
      await order.save();

      return handleError({
        res,
        err: mlMetadataParsed.Error,
        data: mLResponseModelJSON,
      });
    }

    // All Good
    coin.isGraded = true;
    coin.gradingMetadata = {
      value: mlMetadataParsed.Coin_Grade,
      _mlResponse: mLResponseModel._id,
    };
    await coin.save();

    order.status = 'confirmed';
    await order.save();

    // Create a Transaction record
    const currency = 'credit';
    const transaction = await TransactionModel({
      userId: __user._id,
      transactionId: `COIN-GRADING-${uuidv4()}`,
      action: 'COIN_GRADING',
      amount: CREDIT_FEE_FOR_GRADING,
      currency,
      status: 'approved',
      payUsing: 'internal',
      description: 'Apply coin grading.',
      _order: order._id,
    });

    // Save order
    order._transaction = transaction._id;
    await order.save();

    // Save transaction
    await transaction.save();

    // Deduct User Credit
    __user.creditCount = __user.creditCount - CREDIT_FEE_FOR_GRADING;
    await __user.save();

    return handleResponse({
      res,
      msg: 'Coin graded successfully.',
      data: mLResponseModelJSON,
    });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.getGradeCoinList = async (req, res) => {
  try {
    const { user: __user } = req;
    const coinList = await getGradeCoinList(__user._id);
    if (!coinList) {
      return handleResponse({
        res,
        data: coinList,
        msg: `Coin Data not found`,
      });
    }
    return handleResponse({
      res,
      data: coinList,
    });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.generateGradingReport = async (req, res) => {
  try {
    const { user: __user } = req;
    const { coinId } = req.params;

    const coins = await get(coinId);
    if (!coins) {
      return handleError({
        statusCode: 400,
        err: 'Coin data not found.',
        res,
      });
    }
    // use Browser in headless mode
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium-browser',
    });
    const page = await browser.newPage();

    await page.setContent(`<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title></title>
        <style>
            .invoice-container{
                border:1px solid #000;
                padding:20px;
            }
            .logo-w-text{
                display: flex;
                align-items: center;
            }
            .logo-w-text img{
                margin-right: 15px;
                width: 80px;
                height: 80px;
                object-fit: contain;
            }
            .text-w-h{
                margin-bottom: 10px;
            }
            .text-w-h p span{
                font-weight: bold;
                max-width: 170px;
                width: 100%;
                display: inline-block;
            }
            .text-w-h p.pl-15{
                padding-left: 50px;
            }
            .heading span{
                font-size: 20px;
            }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="invoice-container">
                <div class="logo-w-text">
                    <img src="${coins.pictures.front.url}" />
                    <img src="${coins.pictures.back.url}"  />
                </div>
                <div class="text-w-h">
                    <p class="heading"><span>Grading number:</span> ${coins.gradingMetadata.value}</p>
                </div>
                <div class="text-w-h">
                    <p class="heading"><span>Coin Details:</span></p>
                    <p class="pl-15"><span>History: </span> ${coins.history}</p>
                    <p class="pl-15"><span>Age: </span> ${coins.age}</p>
                    <p class="pl-15"><span>Ruler: </span> ${coins.ruler}</p>
                    <p class="pl-15"><span> Material: </span> - </p>
                    <p class="pl-15"><span> Value: </span> ${coins.price}</p>
                    <p class="pl-15"><span> Weight: </span> ${coins.weight}</p>
                    <p class="pl-15"><span> Diameter: </span> ${coins.diameter}</p>
                </div>
            </div>
        </div>
    </body>
    </html>`);
    let filePath = '';
    const paths = __dirname;
    const nameSplit = paths.split(path.sep);
    for (let i = 1; i < nameSplit.length - 1; i++) {
      // eslint-disable-next-line security/detect-object-injection
      filePath = `${filePath}/${nameSplit[i]}`;
    }
    filePath = `${filePath}/public/PDF/reports/GradeingReport.pdf`;
    await page.pdf({ path: filePath, format: 'A4' }); // Generate pdf
    await browser.close();

    res.download(filePath); // Send file
  } catch (err) {
    return handleError({ res, err });
  }
};
