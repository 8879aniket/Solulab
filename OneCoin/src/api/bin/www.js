/* eslint-disable no-use-before-define */
/* eslint-disable no-unreachable */
/* eslint-disable no-process-exit */
import http from 'http'
import { Server } from 'socket.io'
import app from '../app.js'
import logger from '../config/logger.js'
// eslint-disable-next-line no-unused-vars
import dbConnection from '../connections/dbConnection.js'
import dataMigrate from '../connections/dataMigrate.js'

import {
	socketNotification,
	markAllNotificationAsRead,
} from '../components/notification/notificationService.js'
// eslint-disable-next-line no-unused-vars
import processQueue from '../helpers/processQueue.js'

process.on('uncaughtException', (err) => {
	logger.info('UNCAUGHT EXCEPTION! 💥 Shutting down...')
	logger.error(err.name, err.message)
	// eslint-disable-next-line no-process-exit
	process.exit(1)
})

function normalizePort(val) {
	const port = parseInt(val, 10)

	// eslint-disable-next-line no-restricted-globals
	if (isNaN(port)) {
		// named pipe
		return val
	}

	if (port >= 0) {
		// port number
		return port
	}

	return false
}
const port = normalizePort(process.env.PORT || '3000')

const server = http.createServer(app)
app.set('port', port)

/// /////////////////////SOCKET.IO//////////////////////////

const io = new Server(server, {
	cors: '*',
	path: '/socket',
})

io.on('connection', (socket) => {
	socket.on('join', async (data) => {
		// data = {userId}
		const { userId, limit, page } = data
		socket.join(userId)
		const notificationList = await socketNotification(userId, page, limit)
		io.to(userId).emit('notification', notificationList)
	})

	socket.on('send_notification', async (data) => {
		// data = {userId}
		const { userId, limit, page } = data
		const notificationList = await socketNotification(userId, page, limit)
		io.to(data.userId).emit('notification', notificationList)
	})

	socket.on('mark-read', async (data) => {
		// data = {userId,notificationId}
		await markAllNotificationAsRead({
			notificationId: data.notificationId,
			userId: data.userId,
		})
		const notificationList = await socketNotification(data.userId)
		io.to(data.providerId).emit('notification', notificationList)
	})

	socket.on('mark-all-read', async (data) => {
		// data = {userId}
		const { userId } = data
		await markAllNotificationAsRead({ userId })
		const notificationList = await socketNotification(userId)

		io.to(userId).emit('notification', notificationList)
	})
})

/// ///////////////////SOCKET.IO/////////////////////////////

server.listen(port)
server.on('error', onError)
server.on('listening', onListening)

function onError(error) {
	logger.info('error', error)
	if (error.syscall !== 'listen') {
		throw error
	}
	const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`

	switch (error.code) {
		case 'EACCES':
			logger.error(`${bind} requires elevated privileges`)
			process.exit(1)
			break
		case 'EADDRINUSE':
			logger.error(`${bind} + is already in use`)
			process.exit(1)
			break
		default:
			throw error
	}
}

function onListening() {
	const addr = server.address()
	const bind = typeof addr === 'string' ? `Pipe ${addr}` : `Port ${addr.port}`

	logger.info(`Listening on ${bind}`)
	dataMigrate()
}

process.on('unhandledRejection', (err) => {
	logger.error('UNHANDLED REJECTION! 💥 Shutting down...')
	logger.error(err.name, err)
	server.close(() => {
		process.exit(1)
	})
})

process.on('SIGTERM', () => {
	logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully')
	server.close(() => {
		logger.info('💥 Process terminated!')
	})
})

export default server
