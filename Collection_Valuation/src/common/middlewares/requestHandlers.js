module.exports.handleResponse = ({
  res,
  statusCode = 200,
  msg = 'Success',
  totalData = undefined,
  data = undefined,
  result = 1,
}) => {
  // logger.info(msg,JSON.stringify(data));
  res.status(statusCode).send({ result, msg, data, totalData });
};

module.exports.handleError = ({
  res,
  statusCode = 500,
  err = 'error',
  result = 0,
  data = undefined,
}) => {
  if (err.code === 11000) {
    statusCode = 400;
    let keyName = 'some arbitary key';
    const matches = err.message.match(/index:(.*)_1/);
    if (matches) [, keyName] = matches;
    if (keyName === 'phone') {
      err = 'Phone number is already in use';
    } else {
      err = `'${keyName}' can not be duplicate`;
    }
  }
  res.status(statusCode).send({
    result,
    msg: err instanceof Error ? err.message : err.msg || err,
    data,
  });
};
