const { handleResponse, handleError} = require("../../common/middlewares/requestHandlers");
const Model = require('../../models/coinModel')

const {
  getGradedCoins,
  getGradedCoin,
  deleteGradedCoin,
} = require("../../services/admin/gradedCoins");

module.exports.getGradedCoins = async (req, res) => {
    try{
      const loggedInUser = req.user
      const data = await getGradedCoins()
      res.render('admin/coins/gradedCoins', { data, loggedInUser })
    } catch(err){
      return handleError({ res, err })
    }
}

module.exports.getGradedCoin = async (req, res) => {
  try {
    const loggedInUser = req.user
    const { coinId } = req.params;
    const data = await getGradedCoin(coinId)
    res.render('admin/coins/viewGradedCoin', { data, loggedInUser })
    // handleResponse({ res, data });
  } catch (err) {
    handleError({ res, err });
  }
};

module.exports.deleteGradedCoin = async (req, res) => {
  try {
    const { coinId } = req.params
    const gradedCoin = await Model.findById(coinId)
    if( !gradedCoin || gradedCoin.isDeleted === true){
      return handleResponse({
        res,
        msg:'Graded coin not found or has been already deleted'
      })
    }
    else{
      const data = await deleteGradedCoin(coinId)
    }
  } catch (err) {
    handleError({ res, err });
  }
};

//module.export
