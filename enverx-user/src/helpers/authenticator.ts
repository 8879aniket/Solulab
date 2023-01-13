import { Logger } from '@config/logger'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'

export const authenticatorGenerator = async (email: string) => {
	Logger.info('inside authenticator generator helper')
	try {
		const secret = authenticator.generateSecret()
		const response: any = await new Promise(async (res, rej) => {
			QRCode.toDataURL(authenticator.keyuri(email, 'enverXusers', secret), (err, url) => {
				if (err) {
					rej({ error: err.message })
				}
				res({ url, secret, twoFAType: 'AUTH' })
			})
		})
			.then((data) => data)
			.catch((err) => ({ error: err }))

		return response
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const validateAuthCode = async (code: number, secret: string) => {
	Logger.info('inside validate authenticator helper')
	try {
		if (!authenticator.check(code.toString(), secret)) {
			return false
		}
		return true
	} catch (error) {
		Logger.error(error)
		throw error
	}
}
