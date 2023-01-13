import aws from 'aws-sdk'
import Config from '@config/config'
import { Logger } from '@config/logger'
import { saveMobileOTP } from '@user/service'

const _region: string = Config.AWS.SQS_QUEUE_REGION!
const _accessKeyId: string = Config.AWS.Access_key_ID!
const _secretAccessKey: string = Config.AWS.Secret_access_Key!
const _accountId: number = parseInt(Config.AWS.ACCOUNT_ID!)

aws.config.credentials = {
	accessKeyId: _accessKeyId,
	secretAccessKey: _secretAccessKey,
}
aws.config.update({ region: _region })

let sns = new aws.SNS({ apiVersion: '2010-03-31' })

export const sendSMS = async (
	countryCode: string,
	mobileNumber: number,
	email: string,
	otpCode: number
): Promise<boolean> => {
	try {
		const params = {
			Message: `EnverX User otp is ${otpCode}`,
			PhoneNumber: countryCode + mobileNumber,
		}
		let errorStack: any[] = []
		await sns
			.publish(params)
			.promise()
			.then((data) => {
				Logger.info('OTP sent succesfully')
			})
			.catch((err) => {
				errorStack.push(err)
				Logger.error(err.message)
			})

		if (errorStack.length === 0) {
			const response = await saveMobileOTP(mobileNumber, countryCode, email, otpCode)
			if (response === null) {
				return false
			}
			return true
		}

		return false
	} catch (err) {
		Logger.error(err)
		return false
	}
}
