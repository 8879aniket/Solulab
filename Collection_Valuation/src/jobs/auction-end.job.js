const AuctionModel = require('../models/auctionModel');
const BidsModel = require('../models/biddingModel');
const User = require('../models/userModel');
const { ObjectId } = require('mongoose').Types;

async function GetAuctionWinner(data) {
    
    let _auction = await AuctionModel.findOne({coinId:data.coin._id,isDeleted:false})
    if(!_auction){
        return
    }
    let _bids = await BidsModel.findOne({auctionId:ObjectId(_auction._id)}).sort({ "amount": -1,"createdAt": -1 }).limit(1)
    if(!_bids){
        return
    }

    // Auction winner : _bids.userId
    // Seller : _auction.userId
    await NotifyUser(_bids.userId)
    await NotifyUser(_auction.userId)
}

async function NotifyUser(_user){
   
}

async function AuctionEndJob(data, job, done) {
    await GetAuctionWinner(data);
    await job.remove()
    return done()
}

module.exports = AuctionEndJob