import logger from '../config/logger.js'
import catchAsync from '../helpers/catchAsync.js'
import Achievement from '../components/user/acheivementModel.js'
import User from '../components/user/userModel.js'
import config from '../config/config.js'
import { generateCoordinate } from '../helpers/generateCoordinate.js'
import Blockchain from '../components/fragment/blockchainModel.js'
import Coordinate from '../components/fragment/coordinateModel.js'
import factory from '../components/commonServices.js'
import Landing from '../components/user/landingModel.js'
import CMS from '../components/cms/cmsModel.js'

const acheivementMigrate = catchAsync(async () => {
	const ach = await Achievement.find()
	if (ach.length) return
	logger.info('acheivementMigrate controller')
	await Achievement.insertMany([
		{
			name: 'Squire',
			minimumMerge: 10,
		},
		{
			name: '2st Class Knights',
			minimumMerge: 100,
		},
		{
			name: '1st Class Knights',
			minimumMerge: 250,
		},
		{
			name: 'Companions Class Knights',
			minimumMerge: 500,
		},
		{
			name: 'Commander Class Knights',
			minimumMerge: 750,
		},
		{
			name: 'Grand Commander Class Knights',
			minimumMerge: 1000,
		},
		{
			name: 'Grand Officer Class Knights',
			minimumMerge: 1500,
		},
		{
			name: 'Grand Cipher Class Knights',
			minimumMerge: 3000,
		},
		{
			name: 'Grand Cipher Commander Class',
			minimumMerge: 5000,
		},
		{
			name: 'Grand Meister',
			minimumMerge: 10000,
		},
	])
})

const adminMigrate = catchAsync(async () => {
	const admin = await User.findOne({ role: 'admin' })
	if (admin) return
	logger.info('adminMigrate controller')
	await User.create({
		name: 'admin',
		email: config.adminCreds.email,
		mobileNumber: config.adminCreds.mobileNumber,
		countryCode: config.adminCreds.countryCode,
		role: 'admin',
		password: config.adminCreds.password,
	})
})

const createLastUserdData = catchAsync(async () => {
	const lastFragment = await Blockchain.find()
	if (!lastFragment.length) {
		await Blockchain.create({})
	}
})
const CoordinateData = catchAsync(async () => {
	const coordination = await Coordinate.findOne()
	if (coordination) {
		logger.info('Coordinate Array created already')
		return
	}
	generateCoordinate()
	logger.info('Coordinate Array created')
})

const creatingLandingData = catchAsync(async () => {
	logger.info('creatingLandingData controller')
	const landingData = await Landing.find()
	if (!landingData.length) {
		await factory.createOne(Landing, {})
	}
})

const createCMSData = catchAsync(async () => {
	logger.info('createCMSData controller')
	const cmsData = await CMS.find()
	if (!cmsData.length) {
		await factory.createOne(CMS, {})
	}
})
const dataMigrate = catchAsync(async () => {
	logger.info('datmigrate controller')
	createCMSData()
	creatingLandingData()
	acheivementMigrate()
	adminMigrate()
	createLastUserdData()
	CoordinateData()
})

export default dataMigrate
