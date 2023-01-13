import { SES, config } from 'aws-sdk'

import Config from '@config/config'
import { Logger } from '@config/logger'

const _region: string = Config.AWS.AWS_SES_REGION!
const _accessKeyId: string = Config.AWS.AWS_Access_key_ID!
const _secretAccessKey: string = Config.AWS.AWS_Secret_access_Key!
const _accountId: number = parseInt(Config.AWS.AWS_ACCOUNT_ID!)

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
			Source: Config.AWS.AWS_SES_SOURCE_EMAIL,
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
