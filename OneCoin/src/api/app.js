import express from 'express'
import dotenv from 'dotenv'
import morgan from 'morgan'
import mongoSanitize from 'express-mongo-sanitize'
import xss from 'xss-clean'
import bodyParser from 'body-parser'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import cors from 'cors'
import { AppError } from './helpers/responseHandler.js'
import globalErrorHandler from './helpers/globalErrorHandler.js'
import router from './components/indexRoute.js'
import config from './config/config.js'
import './components/websockets/blockchainEvent.js'

dotenv.config()

const app = express()

app.use(cors())
app.options('*', cors())
app.use(helmet())

app.use(morgan('dev'))

app.use(express.static('public'))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(mongoSanitize())
app.use(xss())
app.use(compression())

app.use(config.apiVersionUrl, router)

app.all('*', (req, res, next) => {
	return next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
})

app.use(globalErrorHandler)

export default app
