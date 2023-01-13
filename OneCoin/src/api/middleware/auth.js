import jwt from 'jsonwebtoken'
import { promisify } from 'util'
import { AppError } from '../helpers/responseHandler.js'
import catchAsync from '../helpers/catchAsync.js'
import config from '../config/config.js'
import User from '../components/user/userModel.js'

const authCheck = catchAsync(async (req, res, next) => {
	// 1) Getting token and check of it's there
	let token
	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
		// eslint-disable-next-line prefer-destructuring
		token = req.headers.authorization.split(' ')[1]
	} else if (req.cookies.jwt) {
		token = req.cookies.jwt
	}

	if (!token) {
		return next(new AppError('You are not logged in! Please log in to get access.', 401))
	}

	// 2) Verification token
	const decoded = await promisify(jwt.verify)(token, config.jwtSecret)

	// 3) Check if user still exists
	const currentUser = await User.findById(decoded.id)
	if (!currentUser) {
		return next(new AppError('The user belonging to this token does no longer exist.', 401))
	}

	// GRANT ACCESS TO PROTECTED ROUTE
	req.user = currentUser
	// res.locals.user = currentUser;
	next()
})

const byPassAuth = async (req, res, next) => {
	try {
		// 1) Getting token and check of it's there
		let token
		if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
			// eslint-disable-next-line prefer-destructuring
			token = req.headers.authorization.split(' ')[1]
		} else if (req.cookies.jwt) {
			token = req.cookies.jwt
		}

		if (!token) {
			return next()
		}

		// 2) Verification token
		const decoded = await promisify(jwt.verify)(token, config.jwtSecret)

		// 3) Check if user still exists
		const currentUser = await User.findById(decoded.id)
		if (!currentUser) {
			return next()
		}

		// GRANT ACCESS TO PROTECTED ROUTE
		req.user = currentUser
		// res.locals.user = currentUser;
		next()
	} catch (err) {
		return next()
	}
}

export { authCheck, byPassAuth }
