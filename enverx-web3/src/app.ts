// Load Path Alias For Transpiled Code [Sync]
import path from 'path'
if (path.extname(__filename) === '.js') {
	require('module-alias/register')
}

import express, { ErrorRequestHandler } from 'express'
import helmet from 'helmet'
import cors from 'cors'

import indexRouter from './components/index'
import { Logger } from '@config/logger'
import db from '@connections/db'
import Config from '@config/config'
import '@websocket/blockchainEvent'

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
		app.listen(Config.PORT, () => {
			Logger.info(`Server is running at ${Config.PORT}`)
			Logger.info('All Consumer services started!')
		})
	})
	.catch((err) => {
		Logger.error('------', err)
	})
