const { handleError } = require('../../common/middlewares/requestHandlers.js');

module.exports.generateRandonCode = (length) => {
  length = length || 6; // By default generates 6 digit code

  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = length; i > 0; --i)
    code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

module.exports.Wrap = function (controller) {
  return async (req, res, next) => {
    try {
      await controller(req, res, next);
    } catch (error) {
      return handleError({ res, error });
    }
  };
};
