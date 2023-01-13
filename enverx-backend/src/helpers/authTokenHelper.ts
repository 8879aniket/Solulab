import axios from 'axios'
import Config from '@config/config'
import { Logger } from '@config/logger'

export const getAuthToken = async () => {
	try {
		const tokenResponse: any = await axios
			.post(`${Config.AUTH.GENERATE_TOKEN}`, {
				accountType: 'Backend Platform',
			})
			.catch((err) => {
				return false
			})
		if (!tokenResponse) return null

		const token: string = tokenResponse.data.data.token

		if (!token) return null
		return token
	} catch (err) {
		Logger.error(err)
		throw err
	}
}
