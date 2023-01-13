const async = require("async");
const {
  handleResponse,
  handleError,
} = require("../../common/middlewares/requestHandlers");

const {
  countUser,
  countOrder,
  countRevenue,
  countCollection,
  countMLResponses,
  chartData
} = require("../../services/admin/dashboard");

module.exports.dashboard = async (req, res) => {
  try {
    const loggedInUser = req.user
    let currentYear = new Date().getFullYear()
    const data = await async.parallel({
      Members: countUser,
      Orders: countOrder,
      Collections: countCollection,
      Revenue: countRevenue,
      Graded: countMLResponses,
    });
    res.render('admin/dashboard/dashboard', {data, loggedInUser, currentYear })
    // handleResponse({ res, data });
  } catch (err) {
    handleError({ res, err });
  }
};
module.exports.chartData = async(req, res)=>{
  try{
    const data = await chartData()
    return handleResponse({ res, data })
  }catch(err){
    return handleError({ res, err })
  }
}