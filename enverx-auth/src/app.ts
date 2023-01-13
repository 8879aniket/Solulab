// Load Path Alias For Transpiled Code [Sync]
import path from 'path'
if (path.extname(__filename) === '.js') {
	require('module-alias/register')
}

import express, { ErrorRequestHandler } from 'express'
import helmet from 'helmet'
import cors from 'cors'

import indexRouter from '@index'
import { Logger } from '@config/logger'
import db from '@connections/db'
import { generateKey } from '@helpers/jwt'
import config from '@config/config'

const app = express()
const port = config.PORT
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
		generateKey()
		app.listen(port, () => {
			Logger.info(`Server is running at ${port}`)
		})
	})
	.catch((err) => {
		Logger.error(err)
	})
