const { handleResponse, handleError } = require("../../common/middlewares/requestHandlers");
const CoinsModel = require("../../models/coinModel")
const mongoose = require('mongoose')

module.exports.getCoins = async () => {
  try {
    const data = await CoinsModel.aggregate([
      {
        $match:{
          isDeleted: false, isCoin: true, isGraded: false
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
  } catch (err) {
    throw err
}
};

module.exports.getCoin = async (coinId) => {
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

module.exports.deleteCoin = async (coinId) => {
  try {
    const data = await CoinsModel.findByIdAndUpdate(
      { _id: coinId },
      { isDeleted: true },
      { new: true }
    )
    return data
  } catch (e) {
    throw e;
  }
};
