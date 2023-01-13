import { Sequelize } from 'sequelize-typescript'
import _user from '@dummy/user/user.model'
import Projects from '@projects/projects.model'
import Withdraw from '@projects/withdraw.model'
import Config from '@config/config'
import { Logger } from '../config/logger'
import _bankDetails from '@dummy/user/bankDetails.model'
import ProjectTransaction from '@projects/projectTransaction.model'
import TokenTransactions from '@projects/tokenTransacions.model'
import SeedVccCredits from '@projects/seedVccCredits.model'
import YearlyProjectProjection from '@projects/yearlyProjectProjection.model'
import Merkle from '@projects/merkle.model'
import BlockchainBalance from '@projects/blockchainBalance.model'
import BlockchainProof from '@projects/blockchainProof.model'
import VccTokenTransaction from '@projects/vccTokenTransaction.model'
import Countries from '@projects/countries.model'
import States from '@projects/states.model'
import Districts from '@projects/subDivision'
import Roadmap from '@projects/roadmap.model'
import Investments from '@projects/investements.model'
import PlatformAnalytics from '@projects/platformAnalytics.model'
import Notify from '@projects/notify.model'

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
	host: _host, // default connect to localhost
	port: Number(_port),
	storage: ':memory:',
	logging: (msg) => Logger.info(msg),
	models: [
		_user,
		Projects,
		_bankDetails,
		Withdraw,
		ProjectTransaction,
		TokenTransactions,
		SeedVccCredits,
		YearlyProjectProjection,
		Merkle,
		BlockchainBalance,
		BlockchainProof,
		VccTokenTransaction,
		Countries,
		States,
		Districts,
		Roadmap,
		Investments,
		PlatformAnalytics,
		Notify,
	],
	define: {
		freezeTableName: true,
	},
})

export default db
