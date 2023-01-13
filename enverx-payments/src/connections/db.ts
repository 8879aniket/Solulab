import { Sequelize } from 'sequelize-typescript'
import _user from '@dummy/user/user.model'
import _admin from '@dummy/admin/admin.model'
import Transactions from '@circlePayment/transection.model'
import Config from '@config/config'
import { Logger } from '../config/logger'

const _database: string = Config.DB.DB_NAME!
// const _dialect: string = Config.DB.DB_DIALECT!
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
	models: [_user, Transactions, _admin],
	define: {
		freezeTableName: true,
	},
})

export default db
