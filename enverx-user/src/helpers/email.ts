import { SES, config } from 'aws-sdk'

import Config from '@config/config'
import { Logger } from '@config/logger'

const _region: string = Config.AWS.SES_REGION!
const _accessKeyId: string = Config.AWS.Access_key_ID!
const _secretAccessKey: string = Config.AWS.Secret_access_Key!
const _accountId: number = parseInt(Config.AWS.ACCOUNT_ID!)

config.update({
	region: _region,
	accessKeyId: _accessKeyId,
	secretAccessKey: _secretAccessKey,
})

const ses = new SES({ apiVersion: '2010-12-01' })

export const sendEmail = async (
	payload: {
		data: string
		email: string
		body?: string
		subject?: string
		html?: string
	},
	templateName: string
) => {
	let { body, email, subject, html, data } = payload

	switch (templateName) {
		case 'temporaryPassword':
			subject = 'Temporary password For Login'
			html = `<html><head><head><body><div>Your Temporary Password is \n ${data}</div></body></html>`
			body = 'Temporary password'
			break
		case 'sendVerification':
			subject = 'OTP for Log in';
			html = `<html><head><head><body><div>Your verification code is ${data} </div></body></html>`,
				body = 'Verification Code'
			break;
		case 'sendVerficationURL':
			subject = 'Verification URL for forgot password';
			html = `<html><head><head><body><div>Your URL for change password :- <a href=${data}>${data}</a> </div></body></html>`,
				body = 'Verification URL'
			break;
		case 'sendEmailVerification':{
			subject = 'Verification URL for email'
			html = `<html><head><head><body><div>Your URL for email verification :-  <a href=${data}>${data}</a> </div></body></html>`,
			body = 'Verification URL'
			break;
		}
		default:
			break
	}

	return ses
		.sendEmail({
			Destination: {
				ToAddresses: [email],
			},
			Message: {
				Body: {
					Html: {
						Charset: 'UTF-8',
						Data: html!,
					},
					Text: {
						Charset: 'UTF-8',
						Data: body!,
					},
				},
				Subject: {
					Charset: 'UTF-8',
					Data: subject!,
				},
			},
			Source: Config.AWS.SES_SOURCE_EMAIL,
		})
		.promise()
		.then((data) => {
			Logger.info('SES Email Sent Successful')
		})
		.catch((err) => {
			Logger.error('SES Email Error', err)
			return { error: err }
		})
}
