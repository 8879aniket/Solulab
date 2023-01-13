const UserModel = require("../../models/userModel");
const OrderModel = require("../../models/orderModel");
const TransactionModel = require("../../models/transactionModel");
const MLResponsesModel = require("../../models/mlResponse.model");
const CoinsModel = require("../../models/coinModel");

module.exports.countUser = async () => {
  try {
    return await UserModel.countDocuments({ isDeleted: false });
  } catch (err) {
    throw err;
  }
};

module.exports.countOrder = async () => {
  try {
    return await OrderModel.countDocuments();
  } catch (err) {
    throw err;
  }
};

module.exports.countRevenue = async () => {
  try {
    const result = await TransactionModel.aggregate([
      {
        $group: {
          _id: null,
          TotalCount: {
            $sum: "$amount",
          },
        },
      },
    ]);
    return result[0]["TotalCount"];
  } catch (err) {
    throw err;
  }
};

module.exports.countCollection = async () => {
  try {
    return await CoinsModel.countDocuments({ isDeleted: false });
  } catch (err) {
    throw err;
  }
};

module.exports.countMLResponses = async () => {
  try {
    return await MLResponsesModel.countDocuments();
  } catch (err) {
    throw err;
  }
};
module.exports.chartData = async()=>{
  try{
    return await TransactionModel.aggregate([
      {
          $group:{
          _id: { month: { $month: "$createdAt" }, year : { $year: "$createdAt" }},
          revenue: {
            "$sum": "$amount"
          }
        }
      },
      {"$sort": { "_id.year":1,"_id.month": 1, }}
    ])
  }catch(err){
    throw err
  }
}