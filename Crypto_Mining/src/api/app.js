import createError from 'http-errors'
import express, { json, urlencoded } from 'express'
import { join } from 'path'
import logger from 'morgan'
import cors from 'cors'
import 'regenerator-runtime'
import indexRouts from './modules/index'
// import userRouts from './modules/user/index'

// global.redis = new redisConnection();

const app = express()
app.use(cors())
app.use(logger('dev'))
app.use(json())
app.use(urlencoded({ extended: false }))
app.use(express.static(join(__dirname, 'public')))
app.use('/api/v1', indexRouts)
app.use((req, res, next) => {
	next(createError(404))
})

module.exports = app
