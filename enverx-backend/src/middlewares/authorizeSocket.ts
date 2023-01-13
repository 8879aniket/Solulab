import axios from 'axios'

import Config from '@config/config'
import { Logger } from '@config/logger'
import messages from '@helpers/messages'
import { Socket } from 'socket.io'

const authorizeSocket = async (socket: Socket): Promise<null | string> => {
	Logger.info('authorize Socket')
	try {
		const authToken = socket.handshake.auth.token

		let user: any
		if (authToken) {
			const result: any = await axios.get(Config.AUTH.VERIFY_TOKEN, {
				headers: {
					authorization: `Bearer ${authToken}`,
				},
			})

			user = result.data?.data
			if (user) {
				socket.data.user = user
				return null
			}
			return messages.INVALID_TOKEN
		}

		return messages.TOKEN_NOT_PROVIDED
	} catch (error: any) {
		Logger.error(error)
		return error
	}
}

export default authorizeSocket
