const mongoose = require('mongoose');
require('dotenv').config('../.env');
const config = require('../src/config/config');
const UserModel = require('../src/models/userModel');
const AuctionModel = require('../src/models/auctionModel');
const CoinModel = require('../src/models/coinModel');

const DB_URL = "mongodb+srv://admin:admin@collection-valuation.wrwlv.mongodb.net/collection-valuation"
const db = mongoose.createConnection(DB_URL, config.db.options)


db.on('connected', async () => {
    console.log('Mongoose connection open to master DB: ' + DB_URL);

    const coinIdsToDelete = await GetAllOrphanedCoins()
    await DeleteCoinWithIds(coinIdsToDelete)
    await DeleteAuctionWithCoinIds(coinIdsToDelete)

    console.log(`Done.`)
});


const coinIdsToDelete = []


async function GetAllOrphanedCoins() {
    const coins = await CoinModel.find().populate({ path: 'userId', select: '_id' })
    for(let i = 0; i < coins.length; i++){
        if(coins[i].userId == null){
            coinIdsToDelete.push(coins[i]._id.toString())
        }
    }
    console.log(`Total Coins: ${coins.length}`)
    return coinIdsToDelete
}


async function DeleteCoinWithIds(coinIdsToDelete) {
    await CoinModel.deleteMany({
        _id: {$in: coinIdsToDelete}
    })
    console.log(`Coins deleted: ${coinIdsToDelete.length}`)
}

async function DeleteAuctionWithCoinIds(coinIdsToDelete) {
    const auctionCount = await AuctionModel.countDocuments({
        coinId: {$in: coinIdsToDelete}
    })

    await AuctionModel.deleteMany({
        coinId: {$in: coinIdsToDelete}
    })

    console.log(`Auctions deleted: ${auctionCount}`)
}
