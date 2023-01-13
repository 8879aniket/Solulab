import axios from 'axios'
import qs from 'qs'
import { Logger } from '@config/logger'
import Config from '@config/config'

export const getVenlyAuthToken = async () => {
	Logger.info('Inside Get Venly Auth Token call')
	try {
		const credsData = qs.stringify({
			grant_type: `client_credentials`,
			client_id: `${Config.VENLY.VENLY_CLIENT_ID}`,
			client_secret: `${Config.VENLY.VENLY_SECRET_ID}`,
		})
		const url =
			'https://login-staging.arkane.network/auth/realms/Arkane/protocol/openid-connect/token'
		const options: object = {
			method: 'post',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			data: credsData,
		}
		const response = await axios(url, options)
		if (response.data) {
			return response.data
		}
		return null
	} catch (err) {
		Logger.error(err)
	}
}

export const getVenlyAPICall = async (baseURL: string) => {
	Logger.info('Inside Get Venly API call')
	try {
		const token = await getVenlyAuthToken()
		if (!token) {
			return null
		}
		Logger.info('Venly Token Created')
		const options: object = {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				Authorization: `Bearer ${token.access_token}`,
			},
		}
		const response = await axios(baseURL, options)
		if (response.data) {
			return response.data
		}
		return null
	} catch (err) {
		Logger.error(err)
	}
}

export const postVenlyAPICall = async (baseURL: string, body: object) => {
	Logger.info('Inside Post Venly API call')
	try {
		const token = await getVenlyAuthToken()
		if (!token) {
			return null
		}
		Logger.info('Venly Token Created')
		const options = {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				Authorization: `Bearer ${token.access_token}`,
			},
			data: body,
		}
		let code = 0
		let message
		Logger.info(`BaseURL Service:- ${baseURL}`)
		const response = await axios(baseURL, options).catch((error) => {
			Logger.error(error.response.data.errors[0])
			code = 510
			message = error.response.data.errors[0]
		})
		if (!response) {
			return { code, message }
		}
		if (response?.data) {
			return response?.data
		}
		return { code, message }
	} catch (err) {
		Logger.error(err)
	}
}
