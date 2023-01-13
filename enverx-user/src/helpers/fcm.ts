import admin from 'firebase-admin'
import Config from '@config/config'
import { Logger } from '@config/logger'

const app = admin.initializeApp({
	credential: admin.credential.cert(Config.FIREBASE.SERVICE_ACCOUNT),
})

interface pushData {
	title: string
	body: string
	requireInteraction?: boolean
	url?: string
	token?: string | string[]
}

export const sendNotification = async (pushData: pushData, topic: string) => {
	Logger.info('Inside sendNotification Helper')
	try {
		const message = {
			notification: {
				title: pushData.title,
				body: pushData.body,
				clickAction: pushData.url,
			},
		}

		//? Send Notification through topics
		const topicSubscription = await app.messaging().subscribeToTopic(pushData.token!, topic)

		if (topicSubscription.failureCount) return { result: 0, error: topicSubscription.errors }

		const sentNotification = await app.messaging().sendToTopic(topic, message)

		return { result: 1, data: { topicSubscription, sentNotification } }
	} catch (err) {
		Logger.error(err)
		return { error: err }
	}
}

export const unsubscribeFromTopic = async (token: string, topic: string) => {
	Logger.info('Inside unsubscribeFromTopic Helper')
	try {
		//? After sending notification Unsubscribe from the topic
		const topicSubscription = await app.messaging().unsubscribeFromTopic(token, topic)

		if (topicSubscription.failureCount) return { result: 0, error: topicSubscription.errors }
		return { result: 1, data: topicSubscription }
	} catch (err) {
		Logger.error(err)
		return { error: err }
	}
}
