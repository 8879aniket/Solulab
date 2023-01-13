/* eslint-disable import/no-unresolved */
/* eslint-disable no-restricted-globals */
/* eslint-disable security/detect-non-literal-regexp */
/* eslint-disable array-callback-return */
import aws from 'aws-sdk'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import moment from 'moment'
import pdf from 'html-pdf'
import path from 'path'
import fs from 'fs'
import _ from 'lodash'
import { Admin } from './adminModel'
import { Role } from './roleModel'
import logger from '../../middleware/logger'
import { Product } from './productModel'
import { Content } from './contentModel'
import { Log } from './logModel'
import { Cart } from '../user/cartModel'
import {
	s3Credentials,
	accountSid,
	authToken,
	twilioNumber,
	appLogo,
} from '../../config/index'
import { handleResponse, handleError } from '../../config/requestHandler'
import { platformVariables } from './platformVariablesModel'
import { userModel } from '../user/userModel'
import { orderModel } from '../user/orderModel'
import { getAccessToken } from '../../middleware/auth'
import {
	checkEmailExist,
	getFormattedDate,
	totalRevenueByDates,
	totalOrdersByDates,
	totalCustomersByDates,
	getMonthPeriod,
	addMinutesToDate,
	sendOtpEmail,
} from './service/adminService'

const twilioClient = require('twilio')(accountSid, authToken)
// import moment from 'moment'
// moment().format()

module.exports = {
	// dashboard apis

	getDashboardData: async (req, res) => {
		try {
			const { fromDate, toDate } = req.query
			let currentPeriodRevenue = 0
			let priorPeriodRevenue = 0
			let revenueGrowth = 0
			let revenue = 0
			const revenueData = await totalRevenueByDates(
				fromDate,
				toDate ? `${toDate} 23:59:59` : undefined
			)
			if (revenueData.length > 0) {
				revenue = revenueData[0].totalRevenue
			}
			// growth calculations
			const currentDate = await getFormattedDate()
			const pastSixthDate = await getFormattedDate(-6)
			const pastSeventhDate = await getFormattedDate(-7)
			const pastFourteenthDate = await getFormattedDate(-13)

			const weekBeforeLastWeekRevenue = await totalRevenueByDates(
				pastFourteenthDate,
				`${pastSeventhDate} 23:59:59`
			)
			const lastWeekRevenue = await totalRevenueByDates(
				pastSixthDate,
				`${currentDate} 23:59:59`
			)

			if (lastWeekRevenue.length > 0) {
				currentPeriodRevenue = lastWeekRevenue[0].totalRevenue
			}
			if (weekBeforeLastWeekRevenue.length > 0) {
				priorPeriodRevenue = weekBeforeLastWeekRevenue[0].totalRevenue
			}
			if (currentPeriodRevenue === 0 && priorPeriodRevenue === 0) {
				revenueGrowth = 0
			} else if (currentPeriodRevenue === 0 && priorPeriodRevenue !== 0) {
				revenueGrowth = -100
			} else if (priorPeriodRevenue === 0 && currentPeriodRevenue !== 0) {
				revenueGrowth = 100
			} else {
				revenueGrowth =
					((currentPeriodRevenue - priorPeriodRevenue) /
						priorPeriodRevenue) *
					100
			}
			let currentPeriodOrders = 0
			let priorPeriodOrders = 0
			let orderGrowth = 0
			const totalOrders = await totalOrdersByDates(
				fromDate,
				toDate ? `${toDate} 23:59:59` : undefined
			)
			const currentDateOrder = await getFormattedDate()
			const pastSixthDateOrder = await getFormattedDate(-6)
			const pastSeventhDateOrder = await getFormattedDate(-7)
			const pastFourteenthDateOrder = await getFormattedDate(-13)

			priorPeriodOrders = await totalOrdersByDates(
				pastFourteenthDateOrder,
				`${pastSeventhDateOrder} 23:59:59`
			)
			currentPeriodOrders = await totalOrdersByDates(
				pastSixthDateOrder,
				`${currentDateOrder} 23:59:59`
			)

			if (currentPeriodOrders === 0 && priorPeriodOrders === 0) {
				orderGrowth = 0
			} else if (currentPeriodOrders === 0 && priorPeriodOrders !== 0) {
				orderGrowth = -100
			} else if (priorPeriodOrders === 0 && currentPeriodOrders !== 0) {
				orderGrowth = 100
			} else {
				orderGrowth =
					((currentPeriodOrders - priorPeriodOrders) /
						priorPeriodOrders) *
					100
			}
			let currentPeriodCustomers = 0
			let priorPeriodCustomers = 0
			let customerGrowth = 0
			const totalCustomers = await totalCustomersByDates(
				fromDate,
				toDate ? `${toDate} 23:59:59` : undefined
			)
			// growth calculations
			const currentDateCustomers = await getFormattedDate()
			const pastSixthDateCustomers = await getFormattedDate(-6)
			const pastSeventhDateCustomers = await getFormattedDate(-7)
			const pastFourteenthDateCustomers = await getFormattedDate(-13)

			priorPeriodCustomers = await totalCustomersByDates(
				pastFourteenthDateCustomers,
				`${pastSeventhDateCustomers} 23:59:59`
			)
			currentPeriodCustomers = await totalCustomersByDates(
				pastSixthDateCustomers,
				`${currentDateCustomers} 23:59:59`
			)

			if (currentPeriodCustomers === 0 && priorPeriodCustomers === 0) {
				customerGrowth = 0
			} else if (
				currentPeriodCustomers === 0 &&
				priorPeriodCustomers !== 0
			) {
				customerGrowth = -100
			} else if (
				priorPeriodCustomers === 0 &&
				currentPeriodCustomers !== 0
			) {
				customerGrowth = 100
			} else {
				customerGrowth =
					((currentPeriodCustomers - priorPeriodCustomers) /
						priorPeriodCustomers) *
					100
			}
			let currentPeriodRevenueGrowth = 0
			let priorPeriodRevenueGrowth = 0
			let revenueGrowthGrowth = 0
			let currentGrowth = 0
			let previousGrowth = 0
			let totalRevenueGrowth = 0
			const currentMonthDates = await getMonthPeriod()
			const previousMonthDates = await getMonthPeriod(-1)
			const currentMonthRevenueData = await totalRevenueByDates(
				currentMonthDates.monthStartDate,
				`${currentMonthDates.monthEndDate} 23:59:59`
			)
			if (currentMonthRevenueData.length > 0) {
				currentGrowth = currentMonthRevenueData[0].totalRevenue
			}
			const previousMonthRevenueData = await totalRevenueByDates(
				previousMonthDates.monthStartDate,
				`${previousMonthDates.monthEndDate} 23:59:59`
			)
			if (previousMonthRevenueData.length > 0) {
				previousGrowth = previousMonthRevenueData[0].totalRevenue
			}

			if (currentGrowth === 0 && previousGrowth === 0) {
				totalRevenueGrowth = '0'
			} else if (currentGrowth === 0 && previousGrowth !== 0) {
				totalRevenueGrowth = '-100'
			} else if (previousGrowth === 0 && currentGrowth !== 0) {
				totalRevenueGrowth = '100'
			} else {
				totalRevenueGrowth =
					((currentGrowth - previousGrowth) / previousGrowth) * 100
			}

			// growth calculations since last week
			const currentDateGrowth = await getFormattedDate()
			const pastSixthDateGrowth = await getFormattedDate(-6)
			const pastSeventhDateGrowth = await getFormattedDate(-7)
			const pastFourteenthDateGrowth = await getFormattedDate(-13)

			const weekBeforeLastWeekRevenueGrowth = await totalRevenueByDates(
				pastFourteenthDateGrowth,
				`${pastSeventhDateGrowth} 23:59:59`
			)
			const lastWeekRevenueGrowth = await totalRevenueByDates(
				pastSixthDateGrowth,
				`${currentDateGrowth} 23:59:59`
			)

			if (lastWeekRevenueGrowth.length > 0) {
				currentPeriodRevenueGrowth =
					lastWeekRevenueGrowth[0].totalRevenue
			}
			if (weekBeforeLastWeekRevenueGrowth.length > 0) {
				priorPeriodRevenueGrowth =
					weekBeforeLastWeekRevenueGrowth[0].totalRevenue
			}

			if (
				currentPeriodRevenueGrowth === 0 &&
				priorPeriodRevenueGrowth === 0
			) {
				revenueGrowthGrowth = 0
			} else if (
				currentPeriodRevenueGrowth === 0 &&
				priorPeriodRevenueGrowth !== 0
			) {
				revenueGrowthGrowth = -100
			} else if (
				priorPeriodRevenueGrowth === 0 &&
				currentPeriodRevenueGrowth !== 0
			) {
				revenueGrowthGrowth = 100
			} else {
				revenueGrowthGrowth =
					((currentPeriodRevenueGrowth - priorPeriodRevenueGrowth) /
						priorPeriodRevenueGrowth) *
					100
			}
			return handleResponse({
				res,
				data: {
					totalRevenue: { revenue, revenueGrowth },
					totalOrders: { totalOrders, orderGrowth },
					totalCustomers: { totalCustomers, customerGrowth },
					totalGrowth: { totalRevenueGrowth, revenueGrowthGrowth },
				},
			})
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},

	totalRevenue: async (req, res) => {
		try {
			const { fromDate, toDate } = req.body
			let currentPeriodRevenue = 0
			let priorPeriodRevenue = 0
			let revenueGrowth = 0
			let revenue = 0
			const revenueData = await totalRevenueByDates(
				fromDate,
				toDate ? `${toDate} 23:59:59` : undefined
			)
			if (revenueData.length > 0) {
				revenue = revenueData[0].totalRevenue
			}
			// growth calculations
			const currentDate = await getFormattedDate()
			const pastSixthDate = await getFormattedDate(-6)
			const pastSeventhDate = await getFormattedDate(-7)
			const pastFourteenthDate = await getFormattedDate(-13)

			const weekBeforeLastWeekRevenue = await totalRevenueByDates(
				pastFourteenthDate,
				`${pastSeventhDate} 23:59:59`
			)
			const lastWeekRevenue = await totalRevenueByDates(
				pastSixthDate,
				`${currentDate} 23:59:59`
			)

			if (lastWeekRevenue.length > 0) {
				currentPeriodRevenue = lastWeekRevenue[0].totalRevenue
			}
			if (weekBeforeLastWeekRevenue.length > 0) {
				priorPeriodRevenue = weekBeforeLastWeekRevenue[0].totalRevenue
			}
			if (currentPeriodRevenue === 0 && priorPeriodRevenue === 0) {
				revenueGrowth = 0
			} else if (currentPeriodRevenue === 0 && priorPeriodRevenue !== 0) {
				revenueGrowth = -100
			} else if (priorPeriodRevenue === 0 && currentPeriodRevenue !== 0) {
				revenueGrowth = 100
			} else {
				revenueGrowth =
					((currentPeriodRevenue - priorPeriodRevenue) /
						priorPeriodRevenue) *
					100
			}
			return handleResponse({ res, data: { revenue, revenueGrowth } })
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},

	totalOrders: async (req, res) => {
		try {
			const { fromDate, toDate } = req.body
			let currentPeriodOrders = 0
			let priorPeriodOrders = 0
			let orderGrowth = 0
			const totalOrders = await totalOrdersByDates(
				fromDate,
				toDate ? `${toDate} 23:59:59` : undefined
			)
			// growth calculations
			const currentDate = await getFormattedDate()
			const pastSixthDate = await getFormattedDate(-6)
			const pastSeventhDate = await getFormattedDate(-7)
			const pastFourteenthDate = await getFormattedDate(-13)

			priorPeriodOrders = await totalOrdersByDates(
				pastFourteenthDate,
				`${pastSeventhDate} 23:59:59`
			)
			currentPeriodOrders = await totalOrdersByDates(
				pastSixthDate,
				`${currentDate} 23:59:59`
			)

			if (currentPeriodOrders === 0 && priorPeriodOrders === 0) {
				orderGrowth = 0
			} else if (currentPeriodOrders === 0 && priorPeriodOrders !== 0) {
				orderGrowth = -100
			} else if (priorPeriodOrders === 0 && currentPeriodOrders !== 0) {
				orderGrowth = 100
			} else {
				orderGrowth =
					((currentPeriodOrders - priorPeriodOrders) /
						priorPeriodOrders) *
					100
			}
			return handleResponse({ res, data: { totalOrders, orderGrowth } })
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},

	totalCustomers: async (req, res) => {
		try {
			const { fromDate, toDate } = req.body
			let currentPeriodCustomers = 0
			let priorPeriodCustomers = 0
			let customerGrowth = 0
			const totalCustomers = await totalCustomersByDates(
				fromDate,
				toDate ? `${toDate} 23:59:59` : undefined
			)
			// growth calculations
			const currentDate = await getFormattedDate()
			const pastSixthDate = await getFormattedDate(-6)
			const pastSeventhDate = await getFormattedDate(-7)
			const pastFourteenthDate = await getFormattedDate(-13)

			priorPeriodCustomers = await totalCustomersByDates(
				pastFourteenthDate,
				`${pastSeventhDate} 23:59:59`
			)
			currentPeriodCustomers = await totalCustomersByDates(
				pastSixthDate,
				`${currentDate} 23:59:59`
			)

			if (currentPeriodCustomers === 0 && priorPeriodCustomers === 0) {
				customerGrowth = 0
			} else if (
				currentPeriodCustomers === 0 &&
				priorPeriodCustomers !== 0
			) {
				customerGrowth = -100
			} else if (
				priorPeriodCustomers === 0 &&
				currentPeriodCustomers !== 0
			) {
				customerGrowth = 100
			} else {
				customerGrowth =
					((currentPeriodCustomers - priorPeriodCustomers) /
						priorPeriodCustomers) *
					100
			}
			return handleResponse({
				res,
				data: { totalCustomers, customerGrowth },
			})
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},

	totalGrowth: async (req, res) => {
		try {
			let currentPeriodRevenue = 0
			let priorPeriodRevenue = 0
			let revenueGrowth = 0
			let currentGrowth = 0
			let previousGrowth = 0
			let totalRevenueGrowth = 0
			const currentMonthDates = await getMonthPeriod()
			const previousMonthDates = await getMonthPeriod(-1)
			const currentMonthRevenueData = await totalRevenueByDates(
				currentMonthDates.monthStartDate,
				`${currentMonthDates.monthEndDate} 23:59:59`
			)
			if (currentMonthRevenueData.length > 0) {
				currentGrowth = currentMonthRevenueData[0].totalRevenue
			}
			const previousMonthRevenueData = await totalRevenueByDates(
				previousMonthDates.monthStartDate,
				`${previousMonthDates.monthEndDate} 23:59:59`
			)
			if (previousMonthRevenueData.length > 0) {
				previousGrowth = previousMonthRevenueData[0].totalRevenue
			}

			if (currentGrowth === 0 && previousGrowth === 0) {
				totalRevenueGrowth = 0
			} else if (currentGrowth === 0 && previousGrowth !== 0) {
				totalRevenueGrowth = -100
			} else if (previousGrowth === 0 && currentGrowth !== 0) {
				totalRevenueGrowth = 100
			} else {
				totalRevenueGrowth =
					((currentGrowth - previousGrowth) / previousGrowth) * 100
			}

			// growth calculations since last week
			const currentDate = await getFormattedDate()
			const pastSixthDate = await getFormattedDate(-6)
			const pastSeventhDate = await getFormattedDate(-7)
			const pastFourteenthDate = await getFormattedDate(-13)

			const weekBeforeLastWeekRevenue = await totalRevenueByDates(
				pastFourteenthDate,
				`${pastSeventhDate} 23:59:59`
			)
			const lastWeekRevenue = await totalRevenueByDates(
				pastSixthDate,
				`${currentDate} 23:59:59`
			)

			if (lastWeekRevenue.length > 0) {
				currentPeriodRevenue = lastWeekRevenue[0].totalRevenue
			}
			if (weekBeforeLastWeekRevenue.length > 0) {
				priorPeriodRevenue = weekBeforeLastWeekRevenue[0].totalRevenue
			}

			if (currentPeriodRevenue === 0 && priorPeriodRevenue === 0) {
				revenueGrowth = 0
			} else if (currentPeriodRevenue === 0 && priorPeriodRevenue !== 0) {
				revenueGrowth = -100
			} else if (priorPeriodRevenue === 0 && currentPeriodRevenue !== 0) {
				revenueGrowth = 100
			} else {
				revenueGrowth =
					((currentPeriodRevenue - priorPeriodRevenue) /
						priorPeriodRevenue) *
					100
			}
			return handleResponse({
				res,
				data: { totalRevenueGrowth, revenueGrowth },
			})
		} catch (err) {
			logger.error(err.message)
			return handleError({ res, err })
		}
	},

	// admin apis

	emailAlreadyExist: async (req, res) => {
		try {
			if (req.body.email === undefined) {
				return res
					.status(403)
					.send({ status: 'error', message: 'Email is required.' })
			}

			if (req.body.email) {
				const data = await checkEmailExist(req.body.email)
				if (data == null) {
					return res.status(404).send({
						status: 'error',
						message: 'Email ID does not exist.',
					})
				}

				if (data !== null) {
					return res.status(200).send({
						status: 'success',
						message: 'Email ID already exist.',
					})
				}
			}
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	createAdmin: async (req, res) => {
		try {
			if (req.body.password === undefined) {
				return res.status(403).send({
					status: 'bad request',
					message: 'Password is required.',
				})
			}
			const checkMobile = await Admin.findOne({
				adminNumber: req.body.adminNumber,
			})
			if (checkMobile) {
				return res.status(500).send({
					status: 'error',
					message: `Phone number already exist.`,
				})
			}
			const checkEmai = await Admin.findOne({
				adminEmail: req.body.adminEmail,
			})
			if (checkEmai) {
				return res.status(500).send({
					status: 'error',
					message: `Phone number already exist.`,
				})
			}
			req.body.password = await bcrypt.hashSync(req.body.password, 8)

			await Admin.create(req.body, (err, query) => {
				if (err) {
					if (err.code === 11000) {
						return res.status(500).send({
							status: 'error',
							message: `Email Id already exist.`,
						})
					}
					return res
						.status(500)
						.send({ status: 'error', message: err.message })
				}
				if (query) {
					Log.create({
						activity: `creat admin name ${req.body.adminName}.`,
						user_id: mongoose.Types.ObjectId(req.userId),
					})
					res.status(200).send({
						status: 'success',
						message: 'Admin created successfully.',
						data: query,
					})
				}
			})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	getAdmin: async (req, res) => {
		try {
			if (
				req.body._id === null ||
				req.body._id === undefined ||
				req.body === undefined
			) {
				return res.status(401).send({
					status: 'error',
					message: 'Id is required.',
				})
			}
			const adminData = await Admin.findOne({
				_id: req.body._id,
			}).populate('role')

			delete adminData._doc.otp
			delete adminData._doc.password

			if (adminData === null) {
				return res
					.status(404)
					.send({ status: 'error', message: 'Admin not found.' })
			}

			if (adminData !== null) {
				Log.create({
					activity: `view admin name ${adminData.adminName}`,
					user_id: mongoose.Types.ObjectId(req.userId),
				})
				return res.status(200).send({
					status: 'success',
					message: 'Admin found.',
					data: adminData,
				})
			}
		} catch (err) {
			logger.log(err)
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},
	// need to fix this
	editAdmin: async (req, res) => {
		try {
			if (req.body._id === undefined) {
				return res.status(401).send({
					status: 'error',
					message: 'Id is required.',
				})
			}
			const checkMobile = await Admin.findOne({
				adminNumber: req.body.editAdmin.adminNumber,
			})
			if (checkMobile) {
				if (checkMobile._id.toString() !== req.body._id.toString()) {
					return res.status(500).send({
						status: 'error',
						message: `Phone number already exist.`,
					})
				}
			}
			const checkEmail = await Admin.findOne({
				adminEmail: req.body.editAdmin.adminEmail,
			})
			if (checkEmail) {
				if (checkEmail._id.toString() !== req.body._id.toString()) {
					return res.status(500).send({
						status: 'error',
						message: `Email already exist.`,
					})
				}
			}
			const updatedAdmin = await Admin.findOneAndUpdate(
				{ _id: req.body._id },
				{ $set: req.body.editAdmin },
				{ new: true }
			)

			if (updatedAdmin) {
				Log.create({
					activity: `edit admin ${req.body.editAdmin.adminName}`,
					user_id: mongoose.Types.ObjectId(req.userId),
				})
				return res.status(200).send({
					status: 'success',
					message: 'Admin is updated successfully.',
					data: updatedAdmin,
				})
			}
		} catch (err) {
			logger.log(err)
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	changeAdminStatus: async (req, res) => {
		try {
			if (req.body._id === undefined || req.body.active === undefined) {
				return res.status(401).send({
					status: 'error',
					message: 'Status and id are required.',
				})
			}
			if (req.body._id === req.userId) {
				return res.status(500).send({
					status: 'error',
					message: 'Admin cannot disable itself',
				})
			}
			const changeStatus = await Admin.findOneAndUpdate(
				{ _id: req.body._id },
				{ $set: { active: req.body.active } },
				{ new: true }
			)
			if (changeStatus == null) {
				return res.status(404).send({
					status: 'error',
					message: "Admin doesn't exist.",
				})
			}
			Log.create({
				activity: `change admin status ${changeStatus.adminName}`,
				user_id: mongoose.Types.ObjectId(req.userId),
			})
			delete changeStatus._doc.otp
			delete changeStatus._doc.password
			return res.status(200).send({
				status: 'success',
				message: 'Admin updated successfully.',
				data: changeStatus,
			})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	getAllAdmin: async (req, res) => {
		try {
			const adminList = await Admin.find()
				.select('-password -otp')
				.populate('role')

			// const resArray = []
			// adminList.forEach(async (adminData) => {
			// 	const roleData = await Role.findById({ _id: adminData.role })
			// 	console.log(roleData.roleName)
			// 	const resObj = {
			// 		_id: adminData._id,
			// 		adminName: adminData.adminName,
			// 		adminNumber: adminData.adminNumber,
			// 		adminEmail: adminData.adminEmail,
			// 		role: adminData.role,
			// 		roleName: roleData.roleName,
			// 		uerType: adminData.uerType,
			// 		active: adminData.active,
			// 		fullName: adminData.fullName,
			// 		permissions: [
			// 			{
			// 				name: 'Admin Management',
			// 				view: adminData.adminPermissions.adminManagement
			// 					.view,
			// 				edit: adminData.adminPermissions.adminManagement
			// 					.edit,
			// 				delete: adminData.adminPermissions.adminManagement
			// 					.delete,
			// 				add: adminData.adminPermissions.adminManagement.add,
			// 				disable:
			// 					adminData.adminPermissions.adminManagement
			// 						.disable,
			// 			},
			// 			{
			// 				name: 'Role Management',
			// 				view: adminData.adminPermissions.roleManagement
			// 					.view,
			// 				edit: adminData.adminPermissions.roleManagement
			// 					.edit,
			// 				delete: adminData.adminPermissions.roleManagement
			// 					.delete,
			// 				add: adminData.adminPermissions.roleManagement.add,
			// 			},
			// 		],
			// 	}
			// 	resArray.push(resObj)
			// })
			// const pass = await bcrypt.hashSync('Password@123', 8)
			// console.log(pass)

			Log.create({
				activity: `view admin list`,
				user_id: mongoose.Types.ObjectId(req.userId),
			})
			return res.status(200).send({
				status: 'success',
				message: 'Admin found.',
				data: adminList,
			})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	updateFullName: async (req, res) => {
		try {
			const admin = await Admin.findOne({ _id: req.userId })
			if (admin == null) {
				return res
					.status(404)
					.send({ status: 'error', message: 'Admin not found.' })
			}

			const updateFullName = await Admin.findOneAndUpdate(
				{ _id: req.userId },
				{ fullName: req.body.fullName, adminName: req.body.adminName },
				{ new: true }
			)

			Log.create({
				activity: `change full name ${req.body.fullName}`,
				user_id: mongoose.Types.ObjectId(req.userId),
			})
			return res.status(200).send({
				status: 'success',
				message: 'Admin name changed successfully.',
				data: updateFullName,
			})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	updateProfileImage: async (req, res) => {
		try {
			if (req.file === null || req.file === undefined) {
				res.status(403).send({
					status: 'error',
					message: 'Image is required.',
				})
			}
			const admin = await Admin.findOne({ _id: req.userId })
			if (admin == null) {
				return res
					.status(404)
					.send({ status: 'error', message: 'Admin not found.' })
			}

			if (admin.image !== undefined && admin.image !== {}) {
				const s3 = new aws.S3(s3Credentials)
				const params = {
					Bucket: 'crypto-mining-bucket-dev',
					Key: admin.image.key,
				}
				s3.deleteObject(params, (err) => {
					if (err) {
						return res
							.status(500)
							.send({ status: 'error', message: err.message })
					}
				})
				await Product.findOneAndUpdate(
					{ _id: req.userId },
					{ image: {} }
				)
			}

			const adminData = await Admin.findOneAndUpdate(
				{ _id: req.userId },
				{
					image: {
						name: req.file.originalname,
						link: req.file.location,
						key: req.file.key,
					},
				},
				{ new: true }
			)

			Log.create({
				activity: `Change profile image.`,
				user_id: mongoose.Types.ObjectId(req.userId),
			})
			return res.status(200).send({
				status: 'success',
				message: 'Image updated successfully.',
				data: adminData,
			})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	updateNumber: async (req, res) => {
		try {
			const admin = await Admin.findOne({ _id: req.userId })
			if (admin == null) {
				return res
					.status(404)
					.send({ status: 'error', message: 'Admin not found.' })
			}

			const updateFullName = await Admin.findOneAndUpdate(
				{ _id: req.userId },
				{ fullName: req.body.fullName },
				{ new: true }
			)

			Log.create({
				activity: `change full name ${req.body.fullName}`,
				user_id: mongoose.Types.ObjectId(req.userId),
			})
			return res.status(200).send({
				status: 'success',
				message: 'Admin name changed successfully.',
				data: updateFullName,
			})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	deleteAdmin: async (req, res) => {
		try {
			const deletedUser = await Admin.findOneAndDelete({
				_id: req.params.userId,
			})
			if (deletedUser == null) {
				return res
					.status(404)
					.send({ status: 'error', message: 'Admin not found.' })
			}

			if (deletedUser != null) {
				Log.create({
					activity: `deleted user name  ${deletedUser.adminName}`,
					user_id: mongoose.Types.ObjectId(req.userId),
				})
				return res.status(200).send({
					status: 'success',
					message: 'Admin deleted successfully.',
					data: deletedUser,
				})
			}

			res.status(404).send({
				status: 'error',
				message: 'Admin does not exist.',
			})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	// role apis
	createRole: async (req, res) => {
		try {
			const roleCheck = await Role.find()
			let testBool = false
			roleCheck.map((ele) => {
				if (
					ele.roleName.toUpperCase() ===
					req.body.roleName.toUpperCase()
				) {
					testBool = true
				}
			})
			if (testBool) {
				return res
					.status(401)
					.send({ status: 'error', message: 'Role already exist.' })
			}
			const roleData = {
				roleName: req.body.roleName,
				createdBy: req.userId,
				inventoryManagement: {
					view: req.body.inventoryManagement.view,
					add: req.body.inventoryManagement.add,
					edit: req.body.inventoryManagement.edit,
					delete: req.body.inventoryManagement.delete,
				},
				userManagement: {
					view: req.body.userManagement.view,
					add: req.body.userManagement.add,
					edit: req.body.userManagement.edit,
					delete: req.body.userManagement.delete,
				},
				orderManagement: {
					view: req.body.orderManagement.view,
					add: req.body.orderManagement.add,
					edit: req.body.orderManagement.edit,
					delete: req.body.orderManagement.delete,
				},
				// contentManagement: {
				// 	view: req.body.contentManagement.view,
				// 	add: req.body.contentManagement.add,
				// 	edit: req.body.contentManagement.edit,
				// 	delete: req.body.contentManagement.delete,
				// },
				// platformVariable: {
				// 	view: req.body.platformVariable.view,
				// 	edit: req.body.platformVariable.edit,
				// },
			}
			await Role.create(roleData, (err, query) => {
				if (err) {
					return res
						.status(500)
						.send({ status: 'error', message: err.message })
				}
				if (query) {
					Log.create({
						activity: `created role`,
						user_id: mongoose.Types.ObjectId(req.userId),
					})
					return res.status(200).send({
						status: 'success',
						message: 'Role created successfully.',
						data: query,
					})
				}
			})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	editRole: async (req, res) => {
		try {
			const roleCheck = await Role.find()
			let testBool = false
			roleCheck.map((ele) => {
				if (
					ele.roleName.toUpperCase() ===
					req.body.roleName.toUpperCase()
				) {
					if (ele._id.toString() !== req.body._id.toString()) {
						testBool = true
					}
				}
			})
			if (testBool) {
				return res
					.status(401)
					.send({ status: 'error', message: 'Role already exist.' })
			}
			const updatedRole = await Role.findOneAndUpdate(
				{ _id: req.body._id },
				{ $set: req.body },
				{ new: true }
			)
			if (updatedRole == null) {
				return res.status(404).send({
					status: 'error',
					message: "Role name doesn't exist.",
				})
			}
			if (updatedRole !== null) {
				Log.create({
					activity: `edited  role ${updatedRole.roleName}`,
					user_id: mongoose.Types.ObjectId(req.userId),
				})
				return res.status(200).send({
					status: 'success',
					message: 'Role updated successfully.',
					data: updatedRole,
				})
			}
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},
	deleteRole: async (req, res) => {
		try {
			const deleteRole = await Role.findOneAndDelete({
				_id: req.params._id,
			})
			if (!deleteRole) {
				return res.status(500).send({
					status: 'error',
					message: `${req.body.name} does not exist.`,
				})
			}
			Log.create({
				activity: `delete  role ${deleteRole.roleName0p0}`,
				user_id: mongoose.Types.ObjectId(req.userId),
			})
			return res.status(200).send({
				status: 'success',
				message: 'Role deleted successfully.',
				data: deleteRole,
			})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	getRole: async (req, res) => {
		try {
			const roleData = await Role.findOne({
				_id: req.params._id,
			})

			if (roleData === null) {
				return res
					.status(404)
					.send({ status: 'error', message: 'Role not found.' })
			}

			if (roleData !== null) {
				Log.create({
					activity: `view  role ${roleData.roleName}`,
					user_id: mongoose.Types.ObjectId(req.userId),
				})
				return res.status(200).send({
					status: 'success',
					message: 'Role found.',
					data: {
						_id: roleData._id,
						roleName: roleData.roleName,
						createdAt: roleData.createdAt,
						permissions: [
							{
								name: 'inventory Management',
								view: roleData.inventoryManagement.view,
								add: roleData.inventoryManagement.add,
								edit: roleData.inventoryManagement.edit,
								delete: roleData.inventoryManagement.delete,
							},
							// {
							// 	name: 'content Management',
							// 	view: roleData.contentManagement.view,
							// 	add: roleData.contentManagement.add,
							// 	edit: roleData.contentManagement.edit,
							// 	delete: roleData.contentManagement.delete,
							// },
							{
								name: 'order Management',
								view: roleData.orderManagement.view,
								add: roleData.orderManagement.add,
								edit: roleData.orderManagement.edit,
								delete: roleData.orderManagement.delete,
							},
							// {
							// 	name: 'platform Variable',
							// 	view: roleData.platformVariable.view,
							// 	add: roleData.platformVariable.add,
							// 	edit: roleData.platformVariable.edit,
							// 	delete: roleData.platformVariable.delete,
							// },
							{
								name: 'user Management',
								view: roleData.userManagement.view,
								add: roleData.userManagement.add,
								edit: roleData.userManagement.edit,
								delete: roleData.userManagement.delete,
							},
						],
						message: 'Role found. ',
						data: roleData,
					},
				})
			}
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	getAllRole: async (req, res) => {
		try {
			const roleList = await Role.find().populate('createdBy')
			Log.create({
				activity: `view roles`,
				user_id: mongoose.Types.ObjectId(req.userId),
			})
			// const roleListArray = []

			// roleList.forEach((roleData) => {
			// 	const roleObj = {
			// 		_id: roleData._id,
			// 		roleName: roleData.roleName,
			// 		createdAt: roleData.createdAt,
			// 		permissions: [
			// 			{
			// 				name: 'inventory Management',
			// 				view: roleData.inventoryManagement.view,
			// 				add: roleData.inventoryManagement.add,
			// 				edit: roleData.inventoryManagement.edit,
			// 				delete: roleData.inventoryManagement.delete,
			// 			},
			// 			{
			// 				name: 'content Management',
			// 				view: roleData.contentManagement.view,
			// 				add: roleData.contentManagement.add,
			// 				edit: roleData.contentManagement.edit,
			// 				delete: roleData.contentManagement.delete,
			// 			},
			// 			{
			// 				name: 'order Management',
			// 				view: roleData.orderManagement.view,
			// 				add: roleData.orderManagement.add,
			// 				edit: roleData.orderManagement.edit,
			// 				delete: roleData.orderManagement.delete,
			// 			},
			// 			{
			// 				name: 'platform Variable',
			// 				view: roleData.platformVariable.view,
			// 				add: roleData.platformVariable.add,
			// 				edit: roleData.platformVariable.edit,
			// 				delete: roleData.platformVariable.delete,
			// 			},
			// 			{
			// 				name: 'user Management',
			// 				view: roleData.userManagement.view,
			// 				add: roleData.userManagement.add,
			// 				edit: roleData.userManagement.edit,
			// 				delete: roleData.userManagement.delete,
			// 			},
			// 		],
			// 	}
			// 	roleListArray.push(roleObj)
			// })
			return res.status(200).send({
				status: 'success',
				message: 'Roles found.',
				data: roleList,
			})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	// product apis
	creatProduct: async (req, res) => {
		try {
			const productCheck = await Product.findOne({ name: req.body.name })
			req.body.deliveryDate = new Date(req.body.deliveryDate)

			if (productCheck != null) {
				// console.log(productCheck)
				return res.status(401).send({
					status: 'error',
					message: 'Product is already exist.',
				})
			}
			const imageArray = []
			req.files.forEach((element) => {
				const imageObj = {
					name: element.originalname,
					link: element.location,
					key: element.key,
				}
				imageArray.push(imageObj)
			})

			req.body.image = imageArray

			Product.create(req.body, (err, query) => {
				if (err) {
					return res
						.status(500)
						.send({ status: 'error', message: err.message })
				}
				if (query) {
					Log.create({
						activity: ` ${req.body.name} product created.`,
						user_id: mongoose.Types.ObjectId(req.userId),
					})
					const tmpSub = query.quantity - query.bookedQty
					if (tmpSub > 0) {
						query.status = 'In stock'
					}
					if (tmpSub === 0) {
						query.status = 'Out of stock'
					}
					res.status(200).send({
						status: 'success',
						message: 'Product created successfully.',
						data: query,
					})
				}
			})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	getProduct: async (req, res) => {
		try {
			const product = await Product.findOne({ _id: req.params._id })
			if (!product) {
				return res.status(404).send({
					status: 'error',
					message: `Product does not exist.`,
				})
			}
			const tmpSub = product.quantity - product.bookedQty
			if (tmpSub > 0) {
				product.status = 'In stock'
			}
			if (tmpSub === 0) {
				product.status = 'Out of stock'
			}
			Log.create({
				activity: ` product view Sucessfully.`,
				user_id: mongoose.Types.ObjectId(req.userId),
			})
			return res.status(200).send({
				status: 'success',
				message: 'Product found.',
				data: product,
			})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	editProduct: async (req, res) => {
		try {
			if (req.body._id === undefined) {
				return res.status(401).send({
					status: 'error',
					message: 'Product id is required.',
				})
			}
			// console.log(req.files);
			// const imageArray = []
			// req.files.forEach((element) => {
			// 	const imageObj = {
			// 		name: element.originalname,
			// 		link: element.location,
			// 		key: element.key,
			// 	}
			// 	imageArray.push(imageObj)
			// })

			// req.body.image = imageArray
			const updatedProduct = await Product.findOneAndUpdate(
				{ _id: req.body._id },
				req.body,
				{ new: true }
			)
			if (updatedProduct) {
				Log.create({
					activity: ` ${updatedProduct.name} product edited.`,
					user_id: mongoose.Types.ObjectId(req.userId),
				})
				const tmpSub =
					updatedProduct.quantity - updatedProduct.bookedQty
				if (tmpSub > 0) {
					updatedProduct.status = 'In stock'
				}
				if (tmpSub === 0) {
					updatedProduct.status = 'Out of stock'
				}
				return res.status(200).send({
					status: 'success',
					message: 'Product updated successfully.',
					data: updatedProduct,
				})
			}
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	// editProduct: async (req, res) => {
	// 	try {
	// 		if (req.body._id === undefined) {
	// 			return res.status(401).send({
	// 				status: 'error',
	// 				message: 'Product id is required',
	// 			})
	// 		}
	// 		const updatedProduct = await Product.findOneAndUpdate(
	// 			{ _id: req.body._id },
	// 			req.body,
	// 			{ new: true }
	// 		)

	// 		if (updatedProduct) {
	// 			Log.create({
	// 				activity: ` ${updatedProduct.name} product edited`,
	// 				user_id: mongoose.Types.ObjectId(req.userId),
	// 			})
	// 			return res.status(200).send({
	// 				status: 'success',
	// 				message: 'Product updated successfully',
	// 				data: updatedProduct,
	// 			})
	// 		}
	// 	} catch (err) {
	// 		return res
	// 			.status(500)
	// 			.send({ status: 'error', message: err.message })
	// 	}
	// },

	deleteProduct: async (req, res) => {
		try {
			if (req.params._id === undefined) {
				return res.status(401).send({
					status: 'error',
					message: 'Product id is required.',
				})
			}
			const deleteProduct = await Product.findOneAndDelete({
				_id: req.params._id,
			})

			if (deleteProduct) {
				Log.create({
					activity: ` ${deleteProduct.name} product deleted.`,
					user_id: mongoose.Types.ObjectId(req.userId),
				})

				return res.status(200).send({
					status: 'success',
					message: 'Product deleted successfully.',
					data: deleteProduct,
				})
			}

			if (deleteProduct == null) {
				return res.status(404).send({
					status: 'error',
					message: `${req.body.name} does not exist.`,
				})
			}
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	addProductToArchive: async (req, res) => {
		try {
			if (req.body._id === undefined) {
				return res.status(401).send({
					status: 'error',
					message: 'Product id is required.',
				})
			}

			const updatedProduct = await Product.findOneAndUpdate(
				{ _id: req.body._id },
				{ $set: { isArchive: true } },
				{ new: true }
			)
			if (!updatedProduct) {
				return res.status(401).send({
					status: 'error',
					message: 'Product not found.',
				})
			}

			await Cart.deleteMany({
				productId: updatedProduct._id,
			})

			if (updatedProduct) {
				Log.create({
					activity: ` ${req.body.name} product added to archive.`,
					user_id: mongoose.Types.ObjectId(req.userId),
				})
				return res.status(200).send({
					status: 'success',
					message: 'Product added to archive successfully.',
					data: updatedProduct,
				})
			}
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	removeProductFromArchive: async (req, res) => {
		try {
			if (req.body._id === undefined) {
				return res.status(401).send({
					status: 'error',
					message: 'Product id is required.',
				})
			}
			const updatedProduct = await Product.findOneAndUpdate(
				{ _id: req.body._id },
				{ $set: { isArchive: false } },
				{ new: true }
			)
			if (updatedProduct) {
				Log.create({
					activity: ` ${req.body.name} product removed from archive.`,
					user_id: mongoose.Types.ObjectId(req.userId),
				})
				return res.status(200).send({
					status: 'success',
					message: 'Product removed from archive successfully.',
					data: updatedProduct,
				})
			}
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	groupRemoveFromArchive: async (req, res) => {
		try {
			if (req.body.ids === undefined) {
				return res.status(401).send({
					status: 'error',
					message: 'Ids are required.',
				})
			}

			const updatedProduct = await Product.updateMany(
				{ _id: { $in: req.body.ids } },
				{ $set: { isArchive: false } },
				{ new: true }
			)

			if (updatedProduct) {
				Log.create({
					activity: ` group unarchive product.`,
					user_id: mongoose.Types.ObjectId(req.userId),
				})
				return res.status(200).send({
					status: 'success',
					message: 'Products removed from archive.',
				})
			}
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	getAllProduct: async (req, res) => {
		try {
			const { minDate, maxDate, search, offset, limit } = req.query

			let { archive } = req.query

			if (archive === undefined) {
				archive = false
			}

			const query = {}
			query.$and = []
			if (archive === true) {
				query.$and.push({ isArchive: true })
			}

			if (archive === false) {
				query.$and.push({ isArchive: false })
			}
			// query.$and.push({
			// 	isArchive: archive,
			// })

			if (minDate && maxDate) {
				query.$and.push({
					createdAt: {
						$gte: moment(minDate).toDate(),
						$lte: moment(maxDate)
							.set({ hour: 23, minute: 59, second: 59 })
							.toDate(),
					},
				})
			}

			// if (In stock === true) {
			// 	query.$and.push({
			// 		deliveryDate: { $lt: new Date().toISOString() },
			// 	})
			// }

			if (search) {
				const searchArray = [{ name: new RegExp(search) }]
				if (!isNaN(search)) {
					searchArray.push(
						{ price: search },
						{ quantity: search },
						{ bookedQty: search }
					)
				}
				if (search.length > 0) {
					query.$and.push({ $or: searchArray })
				}
			}

			const product = await Product.find(query).skip(offset).limit(limit)
			if (product == null) {
				return res.status(404).send({
					status: 'error',
					message: `Product does not exist.`,
				})
			}
			const product2 = []

			product.map((el) => {
				let statusCal = ''
				const tmpSub = el.quantity - el.bookedQty
				if (tmpSub > 0) {
					statusCal = 'In stock'
				}
				if (tmpSub === 0) {
					statusCal = 'Out of stock'
				}

				const resObj = {
					isArchive: el.isArchive,
					quantity: el.quantity,
					bookedQty: el.bookedQty,
					Miner_profits_history: el.Miner_profits_history,
					_id: el._id,
					name: el.name,
					price: el.price,
					cost: el.cost,
					hash_power: el.hash_power,
					power: el.power,
					output_usd_btc: el.output_usd_btc,
					algorithm: el.algorithm,
					description: el.description,
					average_uptime_downtime: el.average_uptime_downtime,
					deliveryDate: el.deliveryDate,
					createdAt: el.createdAt,
					status: statusCal,
					image: el.image,
					itemCode: el.itemCode,
					specification: el.specification,
					warranty: el.warranty,
				}

				product2.push(resObj)
			})
			Log.create({
				activity: ` view product list.`,
				user_id: mongoose.Types.ObjectId(req.userId),
			})
			return res.status(200).send({
				status: 'success',
				message: 'Product found.',
				data: product2,
			})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	listOfUnArchiveProduct: async (req, res) => {
		try {
			const { minDate, maxDate, search, offset, limit } = req.query
			const query = {}
			query.$and = []
			query.$and.push({ isArchive: false })
			if (minDate) {
				query.$and.push({
					createdAt: {
						$gt: new Date(minDate).toISOString(),
						$lte: new Date(maxDate).toISOString(),
					},
				})
			}
			if (search) {
				const searchArray = [{ name: new RegExp(search) }]
				if (!isNaN(search)) {
					searchArray.push(
						{ price: search },
						{ quantity: search },
						{ bookedQty: search }
					)
				}
				if (search.length > 0) {
					query.$and.push({ $or: searchArray })
				}
			}
			const productData = await Product.find(query)
				.skip(offset)
				.limit(limit)
			Log.create({
				activity: ` view UnArchive product list.`,
				user_id: mongoose.Types.ObjectId(req.userId),
			})
			const product = []

			productData.map((el) => {
				let statusCal = ''
				const tmpSub = el.quantity - el.bookedQty
				if (tmpSub > 0) {
					statusCal = 'In stock'
				}
				if (tmpSub === 0) {
					statusCal = 'Out of stock'
				}

				const resObj = {
					isArchive: el.isArchive,
					quantity: el.quantity,
					bookedQty: el.bookedQty,
					Miner_profits_history: el.Miner_profits_history,
					_id: el._id,
					name: el.name,
					price: el.price,
					cost: el.cost,
					hash_power: el.hash_power,
					power: el.power,
					output_usd_btc: el.output_usd_btc,
					algorithm: el.algorithm,
					description: el.description,
					average_uptime_downtime: el.average_uptime_downtime,
					deliveryDate: el.deliveryDate,
					createdAt: el.createdAt,
					status: statusCal,
					image: el.image,
					itemCode: el.itemCode,
				}

				product.push(resObj)
			})

			return res.status(200).send({
				status: 'success',
				message: 'Product found.',
				data: product,
			})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	listOfArchiveProduct: async (req, res) => {
		try {
			const { minDate, maxDate, search, offset, limit } = req.query
			const query = {}
			query.$and = []
			query.$and.push({ isArchive: true })
			if (minDate) {
				query.$and.push({
					createdAt: {
						$gt: new Date(minDate).toISOString(),
						$lte: new Date(maxDate).toISOString(),
					},
				})
			}
			if (search) {
				const searchArray = [{ name: new RegExp(search) }]
				if (!isNaN(search)) {
					searchArray.push(
						{ price: search },
						{ quantity: search },
						{ bookedQty: search }
					)
				}
				if (search.length > 0) {
					query.$and.push({ $or: searchArray })
				}
			}
			const productData = await Product.find(query)
				.skip(offset)
				.limit(limit)
			Log.create({
				activity: ` view Archive product list.`,
				user_id: mongoose.Types.ObjectId(req.userId),
			})
			const product = []

			productData.map((el) => {
				let statusCal = ''
				const tmpSub = el.quantity - el.bookedQty
				if (tmpSub > 0) {
					statusCal = 'In stock'
				}
				if (tmpSub === 0) {
					statusCal = 'Out of stock'
				}

				const resObj = {
					isArchive: el.isArchive,
					quantity: el.quantity,
					bookedQty: el.bookedQty,
					Miner_profits_history: el.Miner_profits_history,
					_id: el._id,
					name: el.name,
					price: el.price,
					cost: el.cost,
					hash_power: el.hash_power,
					power: el.power,
					output_usd_btc: el.output_usd_btc,
					algorithm: el.algorithm,
					description: el.description,
					average_uptime_downtime: el.average_uptime_downtime,
					deliveryDate: el.deliveryDate,
					createdAt: el.createdAt,
					status: statusCal,
					image: el.image,
					itemCode: el.itemCode,
				}

				product.push(resObj)
			})
			return res.status(200).send({
				status: 'success',
				message: 'Product found.',
				data: product,
			})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	// content management apis

	// creatContent: async (req,res) =>{
	// 	try{
	// 		logger.info("inside creatContent")
	// 		logger.info(req.body)
	// 		Content.create(req.body)

	// 	}
	// 	catch(err){
	// 		logger.info(err)
	// 		res.send({error:"eeeeeeeeeer"})
	// 	}
	// }

	getPlatformVariables: async (req, res) => {
		try {
			// logs = Log.find({ user_id: req.user_id })
			// return res.status(200).send({
			// 	status: 'success',
			// 	message: 'log fetched successfully',
			// 	data: logs,
			// })
			// const lol = await platformVariables.create({})
			const variables = await platformVariables.findOne()

			Log.create({
				activity: ` view platform variables.`,
				user_id: mongoose.Types.ObjectId(req.userId),
			})

			return res.send({ status: 'success', data: variables })
		} catch (err) {
			// console.log(err)
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	editPlatformVariables: async (req, res) => {
		try {
			// logs = Log.find({ user_id: req.user_id })
			// return res.status(200).send({
			// 	status: 'success',
			// 	message: 'log fetched successfully',
			// 	data: logs,
			// })
			// const lol = await platformVariables.create({})
			const variables = await platformVariables.findOneAndUpdate(
				{},
				req.body,
				{
					new: true,
				}
			)
			Log.create({
				activity: ` edited platform variables.`,
				user_id: mongoose.Types.ObjectId(req.userId),
			})
			return res.send({ status: 'success', data: variables })
		} catch (err) {
			// console.log(err)
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	getAboutUs: async (req, res) => {
		try {
			logger.info('Inside of get about us controller.')
			const content = await Content.find({}, { aboutUs: 1, _id: 0 })
			// res.status(200).send({
			// 	status: "success", data: { aboutUs: content[0].aboutUs }
			// })
			res.status(200).send({
				status: 'success',
				data: content,
			})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	getPrivacy: async (req, res) => {
		try {
			logger.info('Inside of get about us controller.')
			const content = await Content.find({}, { privacy: 1, _id: 0 })
			res.status(200).send({
				status: 'success',
				data: content,
			})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	getTermsAndConditions: async (req, res) => {
		try {
			logger.info('Inside of get about us controller.')
			const content = await Content.find(
				{},
				{ termsAndConditions: 1, _id: 0 }
			)
			res.status(200).send({
				status: 'success',
				data: content,
			})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	editAboutUs: async (req, res) => {
		try {
			logger.info('Inside edit aboutUs.')
			const editAboutUs = req.body.editData

			const editedData = await Content.updateMany(
				{},
				{ aboutUs: editAboutUs }
			)

			if (editedData) {
				return res.status(200).send({
					status: 'success',
					message: 'Data updated successfully.',
				})
			}
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		} catch (err) {
			logger.info(err)
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	editPrivacy: async (req, res) => {
		try {
			logger.info('inside edit aboutUs.')
			const editPrivacy = req.body.editData

			const editedData = await Content.updateMany(
				{},
				{ privacy: editPrivacy }
			)

			if (editedData) {
				return res.status(200).send({
					status: 'success',
					message: 'Data updated successfully.',
				})
			}
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		} catch (err) {
			logger.info(err)
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	editTermsAndConditions: async (req, res) => {
		try {
			logger.info('Inside edit aboutUs.')
			const editTermsAndConditions = req.body.editData

			const editedData = await Content.updateMany(
				{},
				{ termsAndConditions: editTermsAndConditions }
			)

			if (editedData) {
				return res.status(200).send({
					status: 'success',
					message: 'Data updated successfully.',
				})
			}
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		} catch (err) {
			logger.info(err)
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	// log api

	getAdminLog: async (req, res) => {
		try {
			const logs = Log.find({ user_id: req.user_id })
			return res.status(200).send({
				status: 'success',
				message: 'Log fetched successfully.',
				data: logs,
			})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	removeSignalImage: async (req, res) => {
		try {
			const arr = req.body.key
			const s3 = new aws.S3(s3Credentials)
			let params
			// await Product.updateOne(
			// 	{ name: req.body.productName },
			// 	{ $pull: { image: { key: req.body.key } } },
			// 	{ new: true }
			// )
			const pullData = await Product.findOne({
				name: req.body.productName,
			})
			if (!pullData) {
				return handleError({
					res,
					statusCode: 404,
					message: 'Product not found.',
				})
			}
			const pulldataCloned = JSON.parse(JSON.stringify(pullData))
			let imageContent = pulldataCloned.image
			arr.map((ele) => {
				params = {
					Bucket: 'crypto-mining-bucket-dev',
					Key: ele,
				}
				s3.deleteObject(params, (err) => {
					if (err) {
						return res
							.status(500)
							.send({ status: 'error', message: err.message })
					}
				})
				imageContent = _.omitBy(imageContent, { key: ele })
			})
			pullData.image = Object.values(imageContent)
			pullData.save()
			Log.create({
				activity: `remove image.`,
				user_id: mongoose.Types.ObjectId(req.userId),
			})
			res.status(200).send({
				status: 'success',
				message: 'Product image deleted successfully.',
			})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	addSignalImage: async (req, res) => {
		try {
			const pullData = await Product.findOne({
				name: req.body.name,
			})
			if (!pullData) {
				return handleError({
					res,
					statusCode: 404,
					message: 'Product not found.',
				})
			}
			req.files.map((ele) => {
				const imageObj = {
					name: ele.originalname,
					link: ele.location,
					key: ele.key,
				}
				pullData.image.push(imageObj)
			})
			pullData.save()

			Log.create({
				activity: `added image `,
				user_id: mongoose.Types.ObjectId(req.userId),
			})

			return res.status(200).send({
				status: 'success',
				message: 'Product image added successfully.',
				data: pullData,
			})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	// user management
	getAllUser: async (req, res) => {
		try {
			const { minDate, maxDate, search, offset, limit } = req.query
			const query = {}
			query.$and = []

			query.$and.push({
				createdAt: {
					$lt: new Date().toISOString(),
				},
			})
			if (minDate && maxDate) {
				query.$and.push({
					createdAt: {
						$gte: moment(minDate).toDate(),
						$lte: moment(maxDate)
							.set({ hour: 23, minute: 59, second: 59 })
							.toDate(),
					},
				})
			}
			if (search) {
				const searchArray = [{ email: new RegExp(search) }]
				// if(!isNaN(search)) {
				//     searchArray.push({price: search}, {quantity: search}, {bookedQty: search})
				// }
				if (search.length > 0) {
					query.$and.push({ $or: searchArray })
				}
			}
			const users = await userModel
				.find(query, 'first_name createdAt email active noOfOrder')
				.skip(offset)
				.limit(limit)

			Log.create({
				activity: `view user list.`,
				user_id: mongoose.Types.ObjectId(req.userId),
			})
			return res.status(200).send({ status: 'success', data: users })
		} catch (err) {
			// console.log(err)
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	getUser: async (req, res) => {
		try {
			const users = await userModel.find(
				{ _id: req.body._id },
				'first_name createdAt email'
			)

			Log.create({
				activity: `view user ${req.body.email} `,
				user_id: mongoose.Types.ObjectId(req.userId),
			})

			return res.send({ status: 'success', data: users })
		} catch (err) {
			// console.log(err)
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	changeUserStatus: async (req, res) => {
		try {
			if (
				req.body._id === undefined ||
				req.body.userStatus === undefined
			) {
				return res.status(401).send({
					status: 'error',
					message: 'User status and email are required.',
				})
			}
			const changeStatus = await userModel.findOneAndUpdate(
				{ _id: req.body._id },
				{ $set: { active: req.body.userStatus } },
				{ new: true }
			)
			if (changeStatus == null) {
				return res.status(404).send({
					status: 'error',
					message: "User doesn't exist.",
				})
			}
			Log.create({
				activity: `User Status changed to ${req.body.userStatus}.`,
				user_id: mongoose.Types.ObjectId(req.body._id),
			})
			if (changeStatus !== null) {
				return res.status(200).send({
					status: 'success',
					message: 'User status updated successfully.',
					data: changeStatus,
				})
			}
		} catch (err) {
			// console.log(err)
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	getOrder: async (req, res) => {
		try {
			const order = await orderModel
				.find({
					order_id: req.params.order_id,
				})
				.populate('user_id')
			if (!order) {
				return res.status(401).send({
					status: 'error',
					message: 'Order not found.',
				})
			}
			Log.create({
				activity: `Order fetched successfully.`,
				user_id: mongoose.Types.ObjectId(order.user_id),
			})
			return res.status(200).send({
				status: 'success',
				message: 'Order fetched successfully.',
				data: order,
			})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	editOrderStatus: async (req, res) => {
		try {
			if (
				req.body.status === undefined ||
				req.body.order_id === undefined
			) {
				return res.status(401).send({
					status: 'error',
					message: 'Status and order id are required.',
				})
			}
			const updatedProduct = await orderModel.findOneAndUpdate(
				{ order_id: req.body.order_id },
				{ $set: { status: req.body.status } },
				{ new: true }
			)
			if (!updatedProduct) {
				return res.status(401).send({
					status: 'error',
					message: 'Product not found.',
				})
			}
			Log.create({
				activity: `Product status updated to ${req.body.status}. `,
				user_id: mongoose.Types.ObjectId(updatedProduct.user_id),
			})
			return res.status(200).send({
				status: 'success',
				message: 'Order status updated successfully.',
				data: updatedProduct,
			})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},
	getAllOrder: async (req, res) => {
		try {
			const { minDate, maxDate, search, offset, limit } = req.query
			const query = {}
			query.$and = []
			// query.$and.push({})
			query.$and.push({
				createdAt: {
					$lt: new Date().toISOString(),
				},
			})
			if (minDate && maxDate) {
				query.$and.push({
					createdAt: {
						$gte: moment(minDate).toDate(),
						$lte: moment(maxDate)
							.set({ hour: 23, minute: 59, second: 59 })
							.toDate(),
					},
				})
			}

			if (req.query.status !== undefined) {
				query.$and.push({
					status: req.query.status,
				})
			}

			if (search) {
				const searchArray = [
					{ order_id: new RegExp(search) },
					{ payment_id: new RegExp(search) },
				]
				if (!isNaN(search)) {
					searchArray.push({ price: search })
				}
				if (search.length > 0) {
					query.$and.push({ $or: searchArray })
				}
			}

			const order = await orderModel.find(query).skip(offset).limit(limit)
			return res.status(200).send({
				status: 'success',
				message: 'Order details fetched successfully.',
				data: order,
			})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	getUserOrder: async (req, res) => {
		try {
			const { userID } = req.params
			const userData = await userModel.findById({ _id: userID })
			if (!userData) {
				return res.status(401).send({
					status: 'error',
					message: 'User not found.',
				})
			}
			const OrderData = await orderModel.find({ user_id: userID })
			Log.create({
				activity: `User Order detail fetched.`,
				user_id: mongoose.Types.ObjectId(userID),
			})
			return res.status(200).send({
				message: 'Order details fetch successfully.',
				status: 'success',
				data: { userData, OrderData },
			})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	signIn: async (req, res) => {
		try {
			// const match = await bcrypt.compare(password, user.pa
			if (req.body.email === undefined) {
				return res.status(401).send({
					status: 'error',
					message: 'Email is required.',
				})
			}
			if (req.body.password === undefined) {
				return res.status(401).send({
					status: 'error',
					message: 'Password is required.',
				})
			}

			const admin = await Admin.findOne(
				{ adminEmail: req.body.email },
				'_id adminEmail password adminNumber userType country_code'
			).lean()

			if (!admin) {
				return res.status(401).send({
					status: 'error',
					message: 'Invalid email or password.',
				})
			}

			if (admin.active === false) {
				return res.status(401).send({
					status: 'error',
					message: 'User is disabled by Admin',
				})
			}

			if (admin) {
				const match = await bcrypt.compare(
					req.body.password,
					admin.password
				)

				if (match === true) {
					const totp = Math.floor(100000 + Math.random() * 900000)
					// OTP expire time
					const date = new Date()
					const expireTime = new Date(date.getTime() + 15 * 60000)
					await twilioClient.messages
						.create({
							body: ` Admin your otp is ${totp}.`,
							from: twilioNumber,
							to: `${admin.country_code}${admin.adminNumber}`,
						})
						// eslint-disable-next-line no-unused-vars
						.then(async (message) => {
							await Admin.updateOne(
								{
									_id: `${admin._id}`,
								},
								{ otp: totp, otpExpireTime: expireTime },
								(err, data) => {
									if (err) {
										return res.status(500).send({
											status: 'error',
											message: err.message,
										})
									}
									if (data) {
										return res.status(200).send({
											message: `OTP sent successfully ${totp}.`,
											status: 'success',
											data: {
												adminNumber: admin.adminNumber,
												countrycode: admin.country_code,
											},
										})
									}
								}
							)
						})
						.catch((err) => {
							return res
								.status(500)
								.send({ status: 'error', message: err.message })
						})
				}
				if (match === false) {
					return res.status(401).send({
						status: 'error',
						message: 'Invalid email or password.',
					})
				}
			}
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	verifyOtp: async (req, res) => {
		try {
			logger.info('inside verifyOtp')
			const otpCheck = await Admin.findOne({
				adminEmail: req.body.email,
				adminNumber: req.body.number,
			})
			const date = new Date()
			if (date >= otpCheck.otpExpireTime) {
				return res.status(403).send({
					status: 'error',
					message: 'OTP expired',
				})
			}
			if (req.body.otp !== otpCheck.otp) {
				return res.status(403).send({
					status: 'error',
					message: 'Invalid OTP',
				})
			}

			const rolePermission = await Role.findOne(
				{
					_id: mongoose.Types.ObjectId(otpCheck.role),
				},
				'userManagement orderManagement inventoryManagement'
			)

			const accessToken = await getAccessToken(
				otpCheck._id,
				otpCheck.userType
			)
			if (otpCheck !== null) {
				return res.status(200).send({
					status: 'success',
					message: 'Logged in successfully.',
					token: accessToken,
					user: {
						adminName: otpCheck.adminName,
						adminNumber: otpCheck.adminNumber,
						countrycode: otpCheck.country_code,
						adminEmail: otpCheck.adminEmail,
						role: otpCheck.role,
						userType: otpCheck.userType,
						image: otpCheck.image,
						fullName: otpCheck.fullName,
						permissions: [
							{
								name: 'adminManagement',
								view: otpCheck.adminPermissions.adminManagement
									.view,
								edit: otpCheck.adminPermissions.adminManagement
									.edit,
								delete: otpCheck.adminPermissions
									.adminManagement.delete,
								disable:
									otpCheck.adminPermissions.adminManagement
										.disable,
								add: otpCheck.adminPermissions.adminManagement
									.add,
							},
							{
								name: 'roleManagement',
								view: otpCheck.adminPermissions.roleManagement
									.view,
								edit: otpCheck.adminPermissions.roleManagement
									.edit,
								delete: otpCheck.adminPermissions.roleManagement
									.delete,
								add: otpCheck.adminPermissions.roleManagement
									.add,
							},
							{
								name: 'userManagement',
								view: rolePermission.userManagement.view,
								edit: rolePermission.userManagement.edit,
								delete: rolePermission.userManagement.delete,
								add: rolePermission.userManagement.add,
							},
							{
								name: 'orderManagement',
								view: rolePermission.orderManagement.view,
								edit: rolePermission.orderManagement.edit,
								delete: rolePermission.orderManagement.delete,
								add: rolePermission.orderManagement.add,
							},
							// {
							// 	name: 'contentManagement',
							// 	view: rolePermission.contentManagement.view,
							// 	edit: rolePermission.contentManagement.edit,
							// 	delete: rolePermission.contentManagement.delete,
							// 	add: rolePermission.contentManagement.add,
							// },
							{
								name: 'inventoryManagement',
								view: rolePermission.inventoryManagement.view,
								edit: rolePermission.inventoryManagement.edit,
								delete: rolePermission.inventoryManagement
									.delete,
								add: rolePermission.inventoryManagement.add,
							},
							// {
							// 	name: 'platformVariable',
							// 	view: rolePermission.platformVariable.view,
							// 	edit: rolePermission.platformVariable.edit,
							// },
						],
					},
				})
			}
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	sendOtp: async (req, res) => {
		try {
			const totp = Math.floor(100000 + Math.random() * 900000)

			const admin = await Admin.findOne({ adminNumber: req.body.number })
			twilioClient.messages
				.create({
					body: `Admin  your otp is this ${totp}.`,
					from: twilioNumber,
					to: `${admin.country_code}${admin.adminNumber}`,
				})
				// eslint-disable-next-line no-unused-vars
				.then(async (message) => {
					await Admin.updateOne(
						{ adminNumber: req.body.number },
						{ otp: totp },
						(err, data) => {
							if (err) {
								return res.status(500).send({
									status: 'error',
									message: err.message,
								})
							}
							if (data) {
								return res.send({
									message: 'OTP sent successfully.',
								})
							}
						}
					)
				})
				.catch((err) => {
					return res
						.status(500)
						.send({ status: 'error', message: err.message })
				})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	updateNumberVerifyOtp: async (req, res) => {
		try {
			logger.info('inside verifyOtp')
			const otpCheck = await Admin.findOne(
				{
					adminEmail: req.body.email,
					adminNumber: req.body.number,
					otp: req.body.otp,
				},
				'_id adminEmail password adminNumber userType adminPermissions role adminName'
			)

			if (otpCheck == null) {
				return res.status(403).send({
					status: 'error',
					message: 'Invalid OTP.',
				})
			}

			if (otpCheck !== null) {
				Admin.updateOne(
					{
						adminEmail: req.body.email,
						adminNumber: req.body.number,
					},
					{
						adminNumber: req.body.newNumber,
						country_code: req.body.newCountry_code,
					},
					{ new: true }
				)
				return res.status(200).send({
					status: 'success',
					message: 'Number updated successfully.',
				})
			}
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	updatePassword: async (req, res) => {
		try {
			const { oldPassword, newPassword } = req.body
			if (!oldPassword) {
				return res.status(400).send({
					status: 'error',
					message: 'Old password is required.',
				})
			}
			if (!newPassword) {
				return res.status(400).send({
					status: 'error',
					message: 'New password is required.',
				})
			}
			if (oldPassword.toString() === newPassword.toString()) {
				return res.status(400).send({
					status: 'error',
					message:
						'New password should be different from old password.',
				})
			}
			const admin = await Admin.findById(req.userId)
			if (!admin) {
				return res.status(400).send({
					status: 'error',
					message: 'Admin not found.',
				})
			}
			const match = await bcrypt.compare(oldPassword, admin.password)
			if (!match) {
				return res.status(401).send({
					status: 'error',
					message: 'Invalid old password.',
				})
			}

			admin.password = await bcrypt.hashSync(newPassword, 8)
			admin.save((err) => {
				if (err) {
					return res.status(400).send({
						status: 'error',
						message:
							'Something went wrong! Please try again later.',
					})
				}
				res.send({ status: 'success' })
			})
		} catch (err) {
			logger.error(err.message)
			return res.status(400).send({
				status: 'error',
				message: 'Something went wrong! Please try again later.',
			})
		}
	},

	getActivityLog: async (req, res) => {
		try {
			const { userID } = req.params
			const activityLog = await Log.find({ user_id: userID })
			if (!activityLog) {
				return res.status(401).send({
					status: 'error',
					message: 'Activity Log not found.',
				})
			}
			Log.create({
				activity: `Activity Log Fetched.`,
				user_id: mongoose.Types.ObjectId(req.params.userID),
			})
			return res.status(200).send({
				message: 'Activity log fetch successfully.',
				status: 'success',
				data: activityLog,
			})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},
	generateInvoice: async (req, res) => {
		try {
			const { orderId } = req.params
			const orderData = await orderModel
				.findById({ _id: orderId })
				.populate('user_id')
			const invoice = `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="X-UA-Compatible" content="IE=edge">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title></title>
				<style>
					.invoice-container{
				border:1px solid #000;
				padding:20px;
			}
			.invoice-header{
				width: 50%;
			}
			.invoice-header p{
				font-size: 20px;
				float:right;
			}
			.invoice-details{
				padding: 30px 0px 50px 100px;
				clear: both;
			}
			.logo-w-text{
				float: left;
			}
			.logo-w-text img{
				max-width: 100%;
				object-fit: contain;
				width: 50px;
				height: 50px;
				margin-right: 15px;
				margin-top: 7px;
			}
			.logo-w-text p{
				float: right;
			}
			.i-m-b-10{
				margin-bottom: 10px;
			}
			.i-m-t-20{
				margin-top: 20px;
			}
			.invoice-table{
				overflow-x: auto;padding:0px 100px 30px 100px;
			}
			.invoice-table table{
				border-collapse: collapse;
				width: 100%;    
				border:1px solid #000;
			}
			.invoice-table table th, td {
				text-align: center;
				padding: 8px;
			  }
			  .invoice-table table tr:first-child{
				border:1px solid #000;
			  }
				</style>
			</head>
			<body>
				<div class="wrapper">
					<div class="invoice-container">
						<div class="invoice-header">
							<div class="logo-w-text">
								<img src="${appLogo}">
								<p>Master Mine</p>
							</div>
							<p>Invoice/Bill</p>
						</div>
						<div class="invoice-details">
							<div style="float:left;">
								<p class="i-m-b-10">Order no - ${orderData.order_id}</p>
								<p>Invoice Date - ${orderData.createdAt.toISOString().split('T')[0]}</p>
							</div>
							<div style="float:right;">
								<p><b>Billing Address</b></p>
								<p>${orderData.name}<br>${orderData.address}</p>
								<!-- <p class="i-m-t-20"><b>Shipping Address</b></p>
								<p>John Doe<br>36, Green, Golden Road, Lansing, MI</p> -->
							</div>
						</div>
						<!-- table -->
						<div class="invoice-table" style="clear:both;">
							<table>
							  <tr>
								<th>Sl No.</th>
								<th>Description</th>
								<th>Unit Price</th>
								<th>Qty</th>
								<th>Net Amount</th>
								<th>Tax</th>
								<th>Shipping Charges</th>
								<th>Total</th>
							  </tr>
							  ${orderData.products.map((data, index) => {
									return `<tr>
							  <td>${index + 1}</td>
							  <td>${data.name}</td>
							  <td>${data.price}$</td>
							  <td>${data.qty}</td>
							  <td>${data.price * data.qty}</td>
							  <td>${orderData.tax}</td>
							  <td>${orderData.maintenance_shipping_charge}</td>
							  <td>${
									data.price * data.qty +
									orderData.tax +
									orderData.maintenance_shipping_charge
								}</td>
							  <!--<td>${(
									data.price * data.qty +
									(data.price * data.qty * orderData.tax) /
										100
								).toFixed(2)}$</td>-->
							</tr>`
								})}
							</table>
						  </div>
					</div>
				</div>
			</body>
			</html>`
			let filePath = ''
			const paths = __dirname
			const nameSplit = paths.split(path.sep)
			for (let i = 1; i < nameSplit.length - 1; i++) {
				// eslint-disable-next-line security/detect-object-injection
				filePath = `${filePath}/${nameSplit[i]}`
			}
			filePath = `${filePath}/public/PDF/reports/invoice.pdf`
			const pdfOptions = {
				orientation: 'landscape',
			}
			await pdf.create(invoice, pdfOptions).toFile(filePath, (err) => {
				if (err) {
					return res.status(403).send({
						status: 'error',
						message: 'Something went worng',
					})
				}
				// eslint-disable-next-line security/detect-non-literal-fs-filename
				const pdfData = fs.readFileSync(filePath)
				const basePDF = pdfData.toString('base64')
				// res.contentType('application/pdf')
				return res.send(basePDF)
			})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	forgotPassword: async (req, res) => {
		try {
			const { email } = req.body
			if (!email) {
				return res.status(401).send({
					status: 'error',
					message: 'Email not provided.',
				})
			}
			const user = await checkEmailExist(email)
			if (!user) {
				return res.status(404).send({
					status: 'error',
					message: 'User not found.',
				})
			}
			const otpCode = await Math.floor(100000 + Math.random() * 900000)
			const now = new Date()
			const expirationTime = await addMinutesToDate(now, 10)
			user.otp = otpCode
			user.otpExpireTime = expirationTime
			user.save()
			await sendOtpEmail(email, otpCode, 'PASSWORD')
			return res.status(200).send({
				message: `OTP sent successfully on email.`,
				status: 'success',
				data: { _id: user._id, _email: user.adminEmail },
			})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	verifyForgotPasswordOtp: async (req, res) => {
		try {
			const otpCheck = await Admin.findOne({
				adminEmail: req.body.email,
			})
			if (!otpCheck) {
				return res.status(401).send({
					status: 'error',
					message: 'User not found',
				})
			}
			const date = new Date()
			if (date >= otpCheck.otpExpireTime) {
				return res.status(403).send({
					status: 'error',
					message: 'OTP expired',
				})
			}
			if (req.body.otp.toString() !== otpCheck.otp.toString()) {
				return res.status(403).send({
					status: 'error',
					message: 'Invalid OTP',
				})
			}
			return res.status(200).send({
				status: 'success',
				message: 'OTP verified successfully.',
			})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},

	resetPassword: async (req, res) => {
		try {
			const { newPassword, email } = req.body
			if (!newPassword) {
				return res.status(400).send({
					status: 'error',
					message: 'New password is required.',
				})
			}
			const admin = await Admin.findOne({
				adminEmail: email,
			})
			if (!admin) {
				return res.status(400).send({
					status: 'error',
					message: 'User not found.',
				})
			}
			admin.password = await bcrypt.hashSync(newPassword, 8)
			admin.save((err) => {
				if (err) {
					return res.status(400).send({
						status: 'error',
						message:
							'Something went wrong! Please try again later.',
					})
				}
				return res.status(200).send({
					status: 'success',
					message: 'Password updated successfully.',
				})
			})
		} catch (err) {
			logger.error(err.message)
			return res.status(400).send({
				status: 'error',
				message: 'Something went wrong! Please try again later.',
			})
		}
	},
	updateMobilesendOtp: async (req, res) => {
		try {
			const totp = Math.floor(100000 + Math.random() * 900000)
			const { countrycode, number } = req.body
			const checkMobile = await Admin.findOne({
				adminNumber: number,
			})
			if (checkMobile) {
				return res.status(500).send({
					status: 'error',
					message: `Phone number already exist.`,
				})
			}
			const userData = await Admin.findById({ _id: req.userId })
			if (number.toString() === userData.adminNumber.toString()) {
				return res.status(400).send({
					status: 'error',
					message: 'New number should be different from old number.',
				})
			}
			twilioClient.messages
				.create({
					body: `Admin  your otp is this ${totp}.`,
					from: twilioNumber,
					to: `${countrycode}${number}`,
				})
				.then(async () => {
					await Admin.updateOne(
						{ _id: req.userId },
						{
							otp: totp,
						},
						(err, data) => {
							if (err) {
								return res.status(500).send({
									status: 'error',
									message: err.message,
								})
							}
							if (data) {
								return res.send({
									message: 'OTP sent successfully.',
								})
							}
						}
					)
				})
				.catch((err) => {
					return res
						.status(500)
						.send({ status: 'error', message: err.message })
				})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},
	updateMobileVerifyOtp: async (req, res) => {
		try {
			const { otp, countrycode, number } = req.body
			const otpCheck = await Admin.findById({ _id: req.userId })

			if (otpCheck == null) {
				return res.status(401).send({
					status: 'error',
					message: 'User not found',
				})
			}
			if (otp.toString() !== otpCheck.otp.toString()) {
				return res.status(403).send({
					status: 'error',
					message: 'Invalid OTP',
				})
			}
			otpCheck.country_code = countrycode
			otpCheck.adminNumber = number
			otpCheck.save()
			return res.status(200).send({
				status: 'success',
				message: 'Number updated successfully.',
				data: { countrycode, number },
			})
		} catch (err) {
			return res
				.status(500)
				.send({ status: 'error', message: err.message })
		}
	},
}
