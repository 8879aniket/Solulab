const {
  handleResponse,
  handleError,
} = require('../../common/middlewares/requestHandlers');

module.exports.webhook = async (req, res) => {
  try {
    const data = req.body;
    handleResponse({ res, data });
  } catch (err) {
    handleError({ res, err });
  }
};
