import twilio from 'twilio'
import config from '../config/config.js'
import logger from '../config/logger.js'
// import config from '../config/config.js'
import catchAsync from './catchAsync.js'

const sendSMS = catchAsync(async ({ otp, countryCode, mobileNumber }) => {
	const accountSID = config.sendgrid.account_SID
	const authToken = config.sendgrid.auth_token
	const trialNumber = config.sendgrid.trial_number
	const client = twilio(accountSID, authToken)
	try {
		await client.messages.create({
			body: `Your Verification Code is : ${otp}`,
			from: trialNumber,
			to: `${countryCode}${mobileNumber}`,
		})
		logger.info('Otp sent')
	} catch (e) {
		logger.error(e)
	}
})

export default sendSMS
