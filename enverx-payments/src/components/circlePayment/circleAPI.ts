import axios from 'axios'
import { Logger } from '@config/logger'
import Config from '@config/config'

export const getCircleAPICall = async (baseURL: string) => {
	Logger.info('Inside Get Circle API call')
	try {
		const url: string = `${Config.CIRCLE.CIRCLE_SANDBOX_URL}/v1/${baseURL}`
		const options: object = {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				Authorization: `Bearer ${Config.CIRCLE.CIRCLE_SANDBOX_AUTH_TOKEN}`,
			},
		}
		const response = await axios(url, options)
		Logger.info(response)
		if (response.data) {
			return response.data
		}
		return null
	} catch (err) {
		Logger.error(err)
	}
}

export const postCircleAPICall = async (baseURL: string, body: object) => {
	Logger.info('Inside Post Circle API call')
	try {
		const url: string = `${Config.CIRCLE.CIRCLE_SANDBOX_URL}/v1/${baseURL}`
		const options = {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				Authorization: `Bearer ${Config.CIRCLE.CIRCLE_SANDBOX_AUTH_TOKEN}`,
			},
			data: body,
		}
		let code = 0
		let message
		const response = await axios(url, options).catch((error) => {
			Logger.error(error)
			code = error.response.data.code
			message = error.response.data.message
			console.log(message)
		})
		if (response?.data) {
			return response?.data
		}
		return { code, message }
	} catch (err) {
		Logger.error(err)
	}
}
