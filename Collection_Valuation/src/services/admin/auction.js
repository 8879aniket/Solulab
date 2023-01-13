const AuctionModel = require("../../models/auctionModel")
const bidModel = require("../../models/biddingModel")
const mongoose = require('mongoose')

module.exports.getAuctions = async () => {
  try {
    const data = await AuctionModel.aggregate([
      {
        $match:{
          isEnded: false,
          isDeleted: false
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
      },
      {
        $lookup:{
          from:'coins',
          localField:'coinId',
          foreignField:'_id',
          as:'coinDetails'
        }
      },
      {
        $unwind:{
          path: '$coinDetails'
        }
      }
    ])
    return data
  } catch (e) {
    throw e;
  }
}
module.exports.getCompletedAuctions = async () => {
  try {
    const data = await AuctionModel.aggregate([
      {
        $match:{
          isEnded: true,
          isDeleted: false
        }
      },
      {
        $lookup:{
          from:'users',
          localField:'userId',
          foreignField:'_id',
          as:'userDetail'
        }
      },
      {
        $unwind:{
          path: '$userDetail'
        }
      },
      {
        $lookup:{
          from:'coins',
          localField:'coinId',
          foreignField:'_id',
          as:'coinDetail'
        }
      },
      {
        $unwind:{
          path: '$coinDetail'
        }
      }
    ])
   
    return data
  } catch (e) {
    throw e;
  }
}

module.exports.getAuction = async (auctionId) => {
  try {
    const data = await AuctionModel.aggregate([
      {
        $match:{
          _id: mongoose.Types.ObjectId(auctionId)
        }
      },
      {
        $lookup:{
          from:'coins',
          localField:'coinId',
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
        $lookup:{
          from:'bids',
          localField:'_id',
          foreignField:'auctionId',
          as:'bidderDetails'
        }
      },
      {
        $unwind:{
          path: '$bidderDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
            from: 'users',
            let: { id: '$bidderDetails.userId' },
            pipeline: [{
                $match: {
                    $expr: {
                        $eq: ['$_id', '$$id']
                    }
                }
            },{
              $project:{
                _id:1,
                firstName:1,
                amount:1
              }
            }],
            as: 'userDets'
        }
    },
    {
      $unwind:{
        path: '$userDets',
        preserveNullAndEmptyArrays: true
      }
    }
      
    ])
  
    
    return data
  } catch (e) {
    throw e;
  }
};

module.exports.deleteAuction = async (auctionId) => {
  try {
      const data = await AuctionModel.findByIdAndUpdate(
      { _id: auctionId },
      {$set:{ isDeleted: true }},
      { new: true }
    )

    return data
  } catch (e) {
    throw e;
  }
};
