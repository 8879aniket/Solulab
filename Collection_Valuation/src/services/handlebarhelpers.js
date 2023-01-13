const moment = require('moment');

const helperFunction = {
  // put all of your helpers inside this object
  ifCond(v1, operator, v2, options) {
    switch (operator) {
      case '==':
        return v1 === v2 ? options.fn(this) : options.inverse(this);
      case '===':
        return v1 === v2 ? options.fn(this) : options.inverse(this);
      case '<':
        return v1 < v2 ? options.fn(this) : options.inverse(this);
      case '<=':
        return v1 <= v2 ? options.fn(this) : options.inverse(this);
      case '>':
        return v1 > v2 ? options.fn(this) : options.inverse(this);
      case '>=':
        return v1 >= v2 ? options.fn(this) : options.inverse(this);
      case '&&':
        return v1 && v2 ? options.fn(this) : options.inverse(this);
      case '||':
        return v1 || v2 ? options.fn(this) : options.inverse(this);
      case '!=':
        return v1 !== v2 ? options.fn(this) : options.inverse(this);
      default:
        return options.inverse(this);
    }
  },
  formatDate(date) {
    return moment(date).format('ll');
  },
  displayIndex(value) {
    return value + 1;
  },
  toFixedNumber(value, len) {
    value = parseFloat(value);
    value = value.toFixed(len);
    value = parseFloat(value);
    return value;
  },
  dateTimeFormate(date) {
    return moment(date).format('hh:mm a - DD.MM.YYYY');
  },
  diffDate(date) {
    return moment(date).fromNow();
  },
};

module.exports.helperFunction = helperFunction;
