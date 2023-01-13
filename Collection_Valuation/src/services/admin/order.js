const OrderModel = require("../../models/orderModel");
const mongoose = require('mongoose')

module.exports.getOrders = async () => {
  try {
    const data = await OrderModel.aggregate([
      {
        $match:{
          orderType: 'coinSale'
        }
      },
      {
        $lookup:{
          from: 'users',
          localField: '_buyer',
          foreignField: '_id',
          as: 'buyerDetails'
        }
      },
      {
        $lookup:{
          from: 'users',
          localField: '_seller',
          foreignField: '_id',
          as: 'sellerDetails'
        }
      },
      {
        $lookup:{
          from: 'coins',
          localField: '_coin',
          foreignField: '_id',
          as: 'coinDetails'
        }
      },
      {
        $lookup:{
          from: 'transactions',
          localField: '_id',
          foreignField: '_order',
          as: 'orderAmount'
        }
      },
      {
        $project:{
          _id:1,
          'buyerDetails.firstName':1, 
          'sellerDetails.firstName':1,
          'coinDetails.name':1,
          'coinDetails.price':1,
          'orderAmount.amount':1

        }
      }
    ])
    return data
  } catch (e) {
    throw e;
  }
};

module.exports.getOrder = async (orderId) => {
  try {
    const data = await OrderModel.aggregate([
      {
        $match:{
          _id: mongoose.Types.ObjectId(orderId)
        }
      },
      {
        
        $lookup:{
          from:'coins',
          localField:'_coin',
          foreignField:'_id',
          as:'coinDetails'
        }
      },
      {
        $unwind:{
          path: '$coinDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project:{
          coinDetails:1,
          createdAt:1,
          trackMeta:1
        }
      }
    ])
    return data
  } catch (err) {
    throw err;
  }
}
