import path from 'path'
import { fileURLToPath } from 'url'
import { renderFile } from 'ejs'
import { convert } from 'html-to-text'
import { sgMail } from './sendgridConfig.js'
import logger from '../config/logger.js'
import config from '../config/config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
export default class Email {
	constructor(dataObj) {
		this.to = dataObj.to
		this.name = dataObj.name
		this.from = `One coin`
	}

	// Send the actual email
	async send(template, subject, data) {
		// 1) Render HTML based on a ejs template
		let html

		await renderFile(
			`${__dirname}/../../../public/views/${template}.ejs`,
			{
				data,
				name: this.name, // logo: 'https://nftgallerydev.s3.amazonaws.com/uploads/users/profilePic_1639026124107.png',
			},
			// eslint-disable-next-line no-shadow
			(err, template) => {
				if (err) throw err
				html = template
			}
		)
		const text = convert(html)

		// 2) Define email options

		const obj = {
			to: this.to,
			from: config.sendgrid.mail,
			subject,
			text,
			html,
		}

		return sgMail.send(obj, (err, result) => {
			if (err) {
				logger.error(`Inside mailHelper helper : ${err}`)
			} else {
				logger.info(`Inside mailHelper helper : ${result}`)
			}
		})
	}

	async forgotPassword(data) {
		await this.send('forgot_password', 'Verify OTP', data)
	}

	async text(data) {
		await this.send('text', data.subject, data)
	}
}
