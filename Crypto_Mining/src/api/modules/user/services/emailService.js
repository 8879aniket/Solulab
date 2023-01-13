import sgClient from '@sendgrid/mail'
import ejs from 'ejs'
import fs from 'fs'
import logger from '../../../middleware/logger'
import { smtpSettings, baseUrl } from '../../../config/index'

sgClient.setApiKey(smtpSettings.apiKey)

module.exports.sendConfirmationEmail = async (email, token) => {
	try {
		const subject = 'Please Confirm Your Account'
		const template = fs.readFileSync(
			'./src/api/templates/email/verification.ejs',
			'utf-8'
		)
		const html = ejs.render(template, { token, baseUrl })
		const mailContent = {
			to: email,
			from: smtpSettings.senderEmail, // Use the email address or domain you verified above
			subject,
			html,
		}
		await sgClient.send(mailContent)
	} catch (err) {
		logger.error(err.message)
	}
}

module.exports.sendResetPasswordEmail = async (email, token) => {
	try {
		const subject = 'Reset Your Password'
		const template = fs.readFileSync(
			'./src/api/templates/email/reset_password.ejs',
			'utf-8'
		)
		const html = ejs.render(template, { token, baseUrl })
		const mailContent = {
			to: email,
			from: smtpSettings.senderEmail, // Use the email address or domain you verified above
			subject,
			html,
		}
		await sgClient.send(mailContent)
	} catch (err) {
		logger.error(err.message)
	}
}

module.exports.sendOtpEmail = async (email, otp, type) => {
	try {
		let subject = ''
		let headLine = ''
		if (type === 'VERIFICATION') {
			subject = 'OTP: For Verification'
			headLine = 'Verification of Email Address'
		}
		if (type === '2FA') {
			subject = 'OTP: For Two Step Verification'
			headLine = 'Two Step Verification for Sign in'
		}
		const template = fs.readFileSync(
			'./src/api/templates/email/otp.ejs',
			'utf-8'
		)
		const html = ejs.render(template, { otp, headLine })
		const mailContent = {
			to: email,
			from: smtpSettings.senderEmail, // Use the email address or domain you verified above
			subject,
			html,
		}

		await sgClient.send(mailContent).then(() => {})
	} catch (err) {
		logger.error(err.message)
	}
}
