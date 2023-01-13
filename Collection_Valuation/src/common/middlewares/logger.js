const winston = require('winston');

const { combine, timestamp, printf } = winston.format;

// const myFormat = printf(({
//   level, message, timestamp: timestamp1,
// }) => `${timestamp1} ${level}: ${message}`);

/*

const logger = winston.createLogger({
  // format: combine(
  //   timestamp(),
  //   // myFormat,
  // ),
  transports: [
    new winston.transports.File({
      level: 'info',
      filename: './logs/all-logs.log',
      handleExceptions: true,
      json: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5, // if log file size is greater than 5MB, logfile2 is generated
      colorize: true,
      timestamp: true,
    }),
    new winston.transports.Console({
      level: 'debug',
      handleExceptions: true,
      prettyPrint: true,
      json: true,
      colorize: true,
      timestamp: true,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: './logs/exceptions.log',
      timestamp: true,
      maxsize: 5242880,
      json: true,
      colorize: true,
    }),
  ],
  exitOnError: false,
});


*/

const logger2 = winston.createLogger({
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.label({ label: '[LOGGER]' }),
    winston.format.timestamp({ format: 'YY-MM-DD HH:MM:SS' }),
    winston.format.printf(
      (log) =>
        ` ${log.label}  ${log.timestamp}  ${log.level} : ${log.message} ${
          log.stack ?? ''
        }`
    )
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize({ all: true })),
      level: 'info',
    }),
    new winston.transports.File({
      filename: './logs/exceptions.log',
      level: 'error',
      maxsize: 1000000,
      maxFiles: 20,
      tailable: true,
      zippedArchive: true,
    }),
  ],
})

const logger = logger2
module.exports = logger;
module.exports.stream = {
  write(message) {
    logger.info(message);
  },
};