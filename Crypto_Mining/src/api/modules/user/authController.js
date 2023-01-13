import { User } from './userModel'
// import Helper from '../../../src1/services/helper.service';
// import otpService from '../../../src1/services/otp.service';

module.exports = {
	signIn: async (req, res) => {
		const user = await User.findOne(
			{ email: body.email },
			'_id email password'
		).lean()

		if (!user)
			errorService.throwError(
				'WRONG_CREDENTIALS',
				'Invalid email.',
				HttpStatus.NOT_FOUND
			)

		if (!(await Helper.verifyPassword(user.password, body.password)))
			errorService.throwError(
				'WRONG_CREDENTIALS',
				'Email or password is incorrect.',
				HttpStatus.NOT_FOUND
			)

		await otpService.generateLoginOtp(user._id, user.email)

		return res.json({ sucess: true, message: 'OTP sent on email.' })
	},
	/**
	 * @handler
	 * @description for /auth/verify_otp
	 * @returns JWT if successful
	 */
	verifyOtp: async (req, res) => {
		const { email, otp } = body
		const token = await otpService.verifyOtp(email, otp)
		res.status(HttpStatus.OK).json({ sucess: true, token })
	},
}
