// Load Path Alias For Transpiled Code [Sync]
import path from 'path'
if (path.extname(__filename) === '.js') {
	require('module-alias/register')
}

import cron from 'node-cron'
import express, { ErrorRequestHandler } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { Server } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import indexRouter from './components/index'

import { Logger } from '@config/logger'
import db from '@connections/db'
import Config from '@config/config'
import {
	cronJobToStartLiveProject,
	cronJobToEndLiveProject,
	saveMonthlyInvestements,
	savePlatformAnalytics,
	notifcationCronJobForDraftProject,
} from '@projects/service'
import authorizeSocket from '@middlewares/authorizeSocket'
import socketEvents from '@websockets/socket'
import pubClient, { subClient } from '@connections/redis'

const app = express()

const expressErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
	Logger.error(err.stack)
	res.status(err.status).send(err.message)
}

app.use(express.json())
app.use(helmet())
app.use(cors())
app.use(express.urlencoded({ extended: true }))

app.use('/api/v1', indexRouter)

app.use('/', (req, res) => {
	Logger.info('Inside 404 Error Route')
	res.status(404).send('404 Page Not Found!')
})

// Express Error Handler
app.use(expressErrorHandler)

db.sync({ alter: true })
	.then(() => {
		Logger.info('Database Connected')
		const server = app.listen(Config.PORT, () => {
			// Connect redis
			pubClient.connect()

			// Socket
			const io = new Server(server, {
				cors: {
					origin: '*',
				},
			})

			// Create Redis Adapter for Socket
			const redisAdapter: any = createAdapter(pubClient, subClient)
			io.adapter(redisAdapter)

			socketEvents.io = io
			Logger.info(`Socket Clients count ${io.engine.clientsCount}`)

			// Socket middleware
			io.use(async (socket, next) => {
				Logger.info('Socket Middleware')
				const authError = await authorizeSocket(socket)
				if (authError) return next(new Error(authError))
				next()
			})

			io.on('connection', async (socket) => {
				Logger.info(`Socket Client connected ID: ${socket.id}`)
				socketEvents.socket = socket

				socket.on('disconnect', () => {
					Logger.info(`Socket Client disconnected`)
				})
			})

			Logger.info(`Server is running at ${Config.PORT}`)
			cron.schedule('0 0 * * *', async () => {
				const dateData = new Date(Date.now())
				Logger.info(`Cron Job is working at ${dateData}`)
				await cronJobToStartLiveProject()
			})

			cron.schedule('58 23 * * *', async () => {
				const dateData = new Date(Date.now())
				Logger.info(`Cron Job is working at ${dateData}`)
				await cronJobToEndLiveProject()
				await notifcationCronJobForDraftProject()
			})

			cron.schedule('0 12 * * *', async () => {
				const dateData = new Date(Date.now())
				Logger.info(`Cron Job is working at ${dateData}`)
				await saveMonthlyInvestements()
				await savePlatformAnalytics()
			})
			Logger.info('All Consumer services started!')
		})
	})
	.catch((err) => {
		Logger.error('------', err)
	})
