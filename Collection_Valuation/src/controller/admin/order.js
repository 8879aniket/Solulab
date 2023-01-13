const { handleResponse, handleError } = require("../../common/middlewares/requestHandlers");
const { getOrders, getOrder, deleteOrder } = require("../../services/admin/order");

module.exports.getOrders = async (req, res) => {
  try{
    let message = req.flash('error')
    if(message.length > 0 ){
      message = message[0]
    }else{
      message = null
    }
    let successMessage = req.flash('success')
    if(successMessage.length > 0 ){
      successMessage = successMessage[0]
    }else{
      successMessage = null
    }
    const loggedInUser = req.user
    const data = await getOrders()
    return res.render('admin/orders/orders', { data, loggedInUser, error: message, success: successMessage })
  }catch(err){
    return handleError({ res, err })
  }
};

module.exports.getOrder = async (req, res) => {
  try {
    const loggedInUser = req.user
    const { orderId } = req.params;
    const data = await getOrder(orderId)
    return res.render('admin/orders/viewOrder', { data, loggedInUser })
    return handleResponse({ res, data:{ data, loggedInUser } });
  } catch (err) {
    return handleError({ res, err });
  }
};

module.exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const data = await deleteOrder(orderId)
    req.flash('error', 'This order has been deleted')
    return res.redirect('admin/orders')
    return handleResponse({ res, msg: `Order with id ${id} is deleted` });
  } catch (err) {
    return handleError({ res, err });
  }
}
