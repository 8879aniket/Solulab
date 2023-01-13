const CoinsModel = require("../../models/coinModel");
const mongoose = require('mongoose')

module.exports.getGradedCoins = async () => {
  try {
    const data = await CoinsModel.aggregate([
      {
        $match:{
          isDeleted: false, isCoin: true, isGraded: true
        }
      },
      {
        $lookup:{
          from:'users',
          localField:'userId',
          foreignField:'_id',
          as:'userDetails'
        }
      },
      {
        $unwind:{ 
          path: '$userDetails'
        }
      }
    ])
    return data
  } catch (e) {
    throw e;
  }
};

module.exports.getGradedCoin = async (coinId) => {
  try {
    const data = await CoinsModel.aggregate([
      {
        $match:{
          _id: mongoose.Types.ObjectId(coinId)
        }
      }
    ])
    return data
  } catch (err) {
    throw err;
  }
};

module.exports.deleteGradedCoin = async (coinId) => { 
  try {
    const data = await CoinsModel.findByIdAndUpdate(
      { _id: coinId},
      { $set: { isDeleted: true }},
      { new: true }
    )
    return data
  } catch (e) {
    throw e;
  }
};
