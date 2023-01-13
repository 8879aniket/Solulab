import mongoose from 'mongoose'
import logger from '../../config/logger.js'
import factory from '../commonServices.js'
import { getCurrentDateTime } from '../../helpers/date.js'
import Notification from './notificationModel.js'
import sendSocketNotification from './socketClient.js'

const { ObjectId } = mongoose.Types
const getNotifications = async () => {
	logger.info('Inside getNotifications service')
	try {
		const notifications = await Notification.find({})
		return notifications
	} catch (error) {
		return error
	}
}

const createNotification = async (dataObj) => {
	logger.info('Inside createNotification service')
	try {
		const notifications = await Notification.create(dataObj)
		return notifications
	} catch (error) {
		return error
	}
}

const updateNotification = async (dataObj) => {
	logger.info('Inside updateNotification service')
	try {
		const notificationsData = await Notification.findByIdAndUpdate(dataObj.id, {
			status: dataObj.status,
		})
		return notificationsData
	} catch (error) {
		return error
	}
}

const updateNotificationAsRead = async (notificationIdList) => {
	const readTime = getCurrentDateTime()
	const updateNoti = await Notification.updateMany(
		{
			_id: {
				$in: notificationIdList,
			},
		},
		{
			readAt: readTime,
		},
		{
			new: true,
		}
	)
	return updateNoti
}

const notificationsList = async (userId, page, limit) => {
	try {
		const query = { limit, page, receiverId: ObjectId(userId) }

		const noti = await factory.getAllWithPagination(Notification, query)

		return noti
	} catch (err) {
		return { type: 'err', data: err }
	}
}

const notificationsCount = async (userId) => {
	try {
		const count = await Notification.countDocuments({
			receiverId: ObjectId(userId),
			isRead: false,
		})
		return count
	} catch (err) {
		return { type: 'err', data: err }
	}
}

const generatorNotification = async ({ description, generatorId, receiverId, itemId, type }) => {
	const notification = {
		description,
		generatorId: ObjectId(generatorId),
		receiverId: ObjectId(receiverId),
		itemId: ObjectId(itemId),
		itemType: type,
	}

	const notiData = await createNotification(notification)
	await sendSocketNotification(receiverId)

	return notiData
}

const socketNotification = async (userId, page = 1, limit = 10) => {
	const list = await notificationsList(userId, page, limit)
	const unReadCount = await notificationsCount(userId)
	return { list, unReadCount }
}

const markAllNotificationAsRead = async ({ userId, notificationId }) => {
	let read
	if (notificationId) {
		read = await Notification.updateOne(
			{
				_id: ObjectId(notificationId),
			},
			{
				$set: {
					isRead: true,
				},
			},
			{ new: true }
		)
		return read
	}
	if (userId) {
		read = await Notification.updateMany(
			{
				receiverId: ObjectId(userId),
			},
			{
				$set: {
					isRead: true,
				},
			},
			{ new: true }
		)
		return read
	}
}

export {
	getNotifications,
	createNotification,
	socketNotification,
	updateNotification,
	markAllNotificationAsRead,
	generatorNotification,
	notificationsCount,
	notificationsList,
	updateNotificationAsRead,
}
