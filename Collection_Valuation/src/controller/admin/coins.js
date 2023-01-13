const {
  handleResponse,
  handleError,
} = require("../../common/middlewares/requestHandlers");
const coinModel = require('../../models/coinModel')

const { getCoins, deleteCoin, getCoin } = require("../../services/admin/coin");

module.exports.getCoins = async (req, res) => {
  try {
    const loggedInUser = req.user
    const data = await getCoins()
    res.render('admin/coins/coins', { data, loggedInUser })
    // return handleResponse({ res, data });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.getCoin = async (req, res) => {
  try {
    const loggedInUser = req.user
    const { coinId } = req.params;
    const data = await getCoin(coinId);
    if(data.isDeleted === true){
      return handleResponse({
        res,
        msg:'This coin has been deleted',
        data
      })
    }else{
      res.render('admin/coins/viewCoin.ejs', { data, loggedInUser })
      // return handleResponse({ res, data })
    }
  } catch (err) {
   return handleError({ res, err });
  }
};

module.exports.deleteCoin = async (req, res) => {
  try {
    const { coinId } = req.params;
    const data = await coinModel.findById({ _id: coinId});
    if(data.isDeleted === true){
      return handleResponse({
       res,
       msg: 'Coin is not found or already deleted'
     })

    }else{
      const coin = await deleteCoin(coinId)
      // return handleResponse({ res, msg: `Coin with id ${coinId} is deleted`, data })
    }
  } catch (err) {
    return handleError({ res, err });
  }
}
