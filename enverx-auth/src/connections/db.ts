import { Sequelize } from 'sequelize-typescript'
import Config from '@config/config'
import { Logger } from '../config/logger'

const _database: string = Config.DB.DB_NAME!
// const _dialect: string = Config.DB_DIALECT!
const _username: string = Config.DB.DB_USERNAME!
const _password: string = Config.DB.DB_PASSWORD!
const _host: string = Config.DB.DB_HOST!
const _port: string = Config.DB.DB_PORT!

const db = new Sequelize({
	database: _database,
	dialect: 'postgres',
	username: _username,
	password: _password,
	host: _host,
	port: Number(_port),
	storage: ':memory:',
	logging: (msg) => Logger.info(msg),
	models: [],
})

export default db
