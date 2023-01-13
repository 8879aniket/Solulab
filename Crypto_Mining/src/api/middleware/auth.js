import jwt from 'jsonwebtoken'
import { jwtToken } from '../config'
import { userModel } from '../modules/user/userModel'

// import logger from "../middleware/logger"

module.exports = {
	// verify token

	verifyAuthToken: async (req, res, next) => {
		const token =
			req.headers.Authorization ||
			req.headers.authorization ||
			req.headers['x-access-token']

		if (!token) {
			return res.status(403).send('problem in token')
		}
		try {
			const decoded = jwt.verify(token, jwtToken)
			const { data } = decoded
			req.userId = data.userId
			req.userType = data.userType
			const userData = await userModel.findById({ _id: req.userId })
			if (userData) {
				if (!userData.active) {
					res.status(401).send('User is disabled by Admin')
				}
			}

			return next()
		} catch (err) {
			return res.status(401).send('problem with token')
		}
	},
	// create token
	getAccessToken: async (userId, userType, rememberMe = false) => {
		const data = { userId, userType }
		let expirationTime = 60 * 60 * 8
		if (rememberMe === true) expirationTime *= 24
		return jwt.sign(
			{ exp: Math.floor(Date.now() / 1000) + expirationTime, data },
			jwtToken
		)
	},
}
