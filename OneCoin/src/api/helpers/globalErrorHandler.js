// import logger from '../config/logger.js';
import { AppError } from './responseHandler.js'
import config from '../config/config.js'

const handleCastErrorDB = (err) => {
	const message = `Invalid ${err.path}: ${err.value}.`
	return new AppError(message, 400)
}

const handleDuplicateFieldsDB = (err) => {
	// eslint-disable-next-line security/detect-unsafe-regex
	const value = err.message.match(/(["'])(\\?.)*?\1/)[0]
	const message = `Duplicate field value: ${value}. Please use another value!`
	return new AppError(message, 400)
}

const handleValidationErrorDB = (err) => {
	const errors = Object.values(err.errors).map((el) => el.message)

	const message = `Invalid input data. ${errors.join('. ')}`
	return new AppError(message, 400)
}

const handleJWTError = () => new AppError('Invalid token. Please login again!', 401)

const handleJWTExpiredError = () =>
	new AppError('Your token has expired! Please log in again.', 401)

const sendErrorDev = (err, req, res) => {
	res.status(err.statusCode).json({
		status: err.status,
		error: err,
		message: err.message,
		stack: err.stack,
	})
}
const sendErrorProd = (err, req, res) => {
	if (err.isOperational) {
		return res.status(err.statusCode).json({
			status: err.status,
			message: err.message,
		})
	}
	// logger.error(err);
	return res.status(500).json({
		status: 'error',
		message: 'Something went very wrong!',
	})
}

// eslint-disable-next-line no-unused-vars
const globalErrorHandler = (err, req, res, next) => {
	err.statusCode = err.statusCode || 500
	err.status = err.status || 'error'
	if (config.env === 'development') {
		sendErrorDev(err, req, res)
	} else if (config.env === 'production') {
		let error = { ...err }
		error.message = err.message
		if (err.name === 'CastError') error = handleCastErrorDB(error)
		if (err.code === 11000) error = handleDuplicateFieldsDB(error)
		if (err.name === 'ValidationError') error = handleValidationErrorDB(error)
		if (err.name === 'JsonWebTokenError') error = handleJWTError()
		if (err.name === 'TokenExpiredError') error = handleJWTExpiredError()

		sendErrorProd(error, req, res)
	}
}

export default globalErrorHandler
