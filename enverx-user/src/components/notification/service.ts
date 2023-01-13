import axios from 'axios'
import { Logger } from '@config/logger'
import { NotificationInterface } from '@interfaces/notification'
import Config from '@config/config'
import Notification from './notification.model'

export const createNotification = async (data: NotificationInterface) => {
	Logger.info('inside create notification service')
	try {
		const notification = await Notification.create(data)
		return notification
	} catch (error) {
		Logger.info(error)
		return null
	}
}

export const getNotificationService = async (filter: Partial<{ userId: string; id: string }>) => {
	Logger.info('Inside get Notification Service')
	try {
		const data = await Notification.findAll({ where: filter })
		return data
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}

export const subscribeTopic = async (
	fcmToken: string,
	userId: string,
	topic: string,
	authToken: string
) => {
	Logger.info('Inside get Notification Service')
	try {
		await axios.post(
			`${Config.NOTIFICATION.SUBSCRIBE_TOPIC}/${userId}`,
			{
				fcmToken,
				topic,
			},
			{
				headers: {
					authorization: `Bearer ${authToken}`,
				},
			}
		)
	} catch (error) {
		Logger.error(error)
	}
}

export const unSubscribeTopic = async (
	fcmToken: string,
	userId: string,
	topic: string,
	authToken: string
) => {
	Logger.info('Inside get Notification Service')
	try {
		await axios.post(
			`${Config.NOTIFICATION.UNSUBSCRIBE_TOPIC}/${userId}`,
			{
				fcmToken,
				topic,
			},
			{
				headers: {
					authorization: `Bearer ${authToken}`,
				},
			}
		)
	} catch (error) {
		Logger.error(error)
	}
}
