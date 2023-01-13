/* eslint-disable no-console */
import io from 'socket.io-client'
import config from '../../config/config.js'

const socketClient = io(config.backendHostedUrl, {
	path: '/socket',
	rejectUnauthorized: false,
})

socketClient.on('connect', () => {
	console.log('socket connect')
})

const sendSocketNotification = async (userId) => {
	socketClient.emit('send_notification', { userId })
}

export default sendSocketNotification
