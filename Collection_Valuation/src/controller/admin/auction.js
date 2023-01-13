const {
  handleResponse,
  handleError,
} = require("../../common/middlewares/requestHandlers");
const auctionModel = require('../../models/auctionModel')

const {
  getAuctions,
  getAuction,
  deleteAuction,
  getCompletedAuctions
} = require("../../services/admin/auction")

module.exports.getAuctions = async (req, res) => {
   try{
    const loggedInUser = req.user
     const data = await getAuctions()
     const endedAuctions = await getCompletedAuctions()
     res.render('admin/auction/auctions', {data, endedAuctions, loggedInUser})

   }catch(err){
    return handleError({ res, err })
   }
    
}

module.exports.getSingleAuction = async (req, res) => {
  try {
    const { auctionId } = req.params
    const loggedInUser = req.user
    const data = await getAuction(auctionId)
    // return handleResponse({ res, data })
    res.render('admin/auction/viewAuction', { data, loggedInUser })
  } catch (err) {
    return handleError({ res, err })
  }
};

module.exports.deleteAuction = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const auction = await auctionModel.findById({ _id: auctionId })
    if(!auction || auction.isDeleted === true ){
      return handleResponse({
        res,
        msg:'Auction Id not found or already deleted'
      })
    }
    else{
      const data =  await deleteAuction(auctionId);
      // return handleResponse({ res, msg: `Auction with id ${auctionId} is deleted`, data })
    }
  } catch (err) {
   return handleError({ res, err });
  }
}
