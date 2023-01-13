import moment from 'moment'
import sgClient from '@sendgrid/mail'
import ejs from 'ejs'
import fs from 'fs'
import { Admin } from '../adminModel'
import { orderModel } from '../../user/orderModel'
import { userModel } from '../../user/userModel'
import { smtpSettings } from '../../../config/index'

sgClient.setApiKey(smtpSettings.apiKey)

module.exports.checkEmailExist = async (email) => {
	const data = await Admin.findOne({ adminEmail: email })
	return data
}

module.exports.getFormattedDate = async (day = 0) => {
	let date = new Date()
	if (day !== 0) {
		date.setDate(date.getDate() + day)
	}
	let dd = date.getDate()
	let mm = date.getMonth() + 1
	const yyyy = date.getFullYear()

	if (dd < 10) {
		dd = `0${dd}`
	}
	if (mm < 10) {
		mm = `0${mm}`
	}
	date = `${yyyy}-${mm}-${dd}`
	return date
}

module.exports.totalRevenueByDates = async (fromDate, toDate) => {
	let obj = {}
	if (fromDate && toDate) {
		obj = {
			createdAt: {
				$gte: moment(fromDate).toDate(),
				$lte: moment(toDate)
					.set({ hour: 23, minute: 59, second: 59 })
					.toDate(),
			},
			// createdAt: { $gte: new Date(fromDate), $lte: new Date(toDate) },
		}
	}
	const revenue = await orderModel.aggregate([
		{
			$match: obj,
		},
		{ $group: { _id: null, totalRevenue: { $sum: '$total_price' } } },
	])
	return revenue
}

module.exports.totalOrdersByDates = async (fromDate, toDate) => {
	let obj = {}
	if (fromDate && toDate) {
		obj = {
			createdAt: {
				$gte: moment(fromDate).toDate(),
				$lte: moment(toDate)
					.set({ hour: 23, minute: 59, second: 59 })
					.toDate(),
			},
			// createdAt: {
			// 	$gte: new Date(fromDate),
			// 	$lte: new Date(toDate),
			// },
		}
	}
	const orders = await orderModel.countDocuments(obj)
	return orders
}

module.exports.totalCustomersByDates = async (fromDate, toDate) => {
	let obj = {}
	if (fromDate && toDate) {
		obj = {
			createdAt: {
				$gte: moment(fromDate).toDate(),
				$lte: moment(toDate)
					.set({ hour: 23, minute: 59, second: 59 })
					.toDate(),
			},
			// createdAt: {
			// 	$gte: new Date(fromDate),
			// 	$lte: new Date(toDate),
			// },
		}
	}
	const customers = await userModel.countDocuments(obj)
	return customers
}

module.exports.getMonthPeriod = async (m = 0) => {
	const date = new Date()
	let mm = date.getMonth() + 1
	if (m !== 0) {
		mm += m
	}
	const yyyy = date.getFullYear()
	if (mm < 10) {
		mm = `0${mm}`
	}
	const lastDate = new Date(yyyy, mm, 0)
	const day = lastDate.getDate()
	let month = lastDate.getMonth() + 1
	const year = lastDate.getFullYear()
	if (month < 10) {
		month = `0${month}`
	}
	const dates = {
		monthStartDate: `${yyyy}-${mm}-01`,
		monthEndDate: `${year}-${month}-${day}`,
	}
	return dates
}

module.exports.addMinutesToDate = async (date, minutes) => {
	return new Date(date.getTime() + minutes * 60000)
}

module.exports.sendOtpEmail = async (email, otp, type) => {
	try {
		let subject = ''
		let headLine = ''
		if (type === 'PASSWORD') {
			subject = 'OTP: For Forgot Password'
			headLine = 'Email for reset passsword'
		}
		const template = fs.readFileSync(
			'./src/api/templates/email/otp.ejs',
			'utf-8'
		)
		const html = ejs.render(template, { otp, headLine })
		const mailContent = {
			to: email,
			from: smtpSettings.senderEmail, // Use the email address or domain you verified above
			subject,
			html,
		}

		await sgClient.send(mailContent).then(() => {})
	} catch (err) {
		return err
	}
}
