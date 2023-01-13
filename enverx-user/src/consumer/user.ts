import aws from 'aws-sdk'
import { Consumer } from 'sqs-consumer'

import { Logger } from '@config/logger'
import Config from '@config/config'

const _region: string = Config.AWS.SQS_QUEUE_REGION!
const _accessKeyId: string = Config.AWS.Access_key_ID!
const _secretAccessKey: string = Config.AWS.Secret_access_Key!
const _accountId: number = parseInt(Config.AWS.ACCOUNT_ID!)

aws.config.credentials = {
	accessKeyId: _accessKeyId,
	secretAccessKey: _secretAccessKey,
}

aws.config.update({ region: _region })

const sqs = new aws.SQS({ apiVersion: '2012-11-05' })

export const sendMessage = async (
	userId: string,
	method: string,
	payload: { queueName: string; data: object }
) => {
	const sendData = {
		MessageAttributes: {
			Queue: {
				DataType: 'String',
				StringValue: payload.queueName,
			},
			Method: {
				DataType: 'String',
				StringValue: method,
			},
		},
		MessageBody: JSON.stringify(payload.data),
		MessageDeduplicationId: Date.now().toString(),
		MessageGroupId: 'UserTest',
		QueueUrl: `https://sqs.${_region}.amazonaws.com/${_accountId}/${payload.queueName}.fifo`,
	}

	return new Promise((resolve, reject) => {
		sqs.sendMessage(sendData, function (err, data) {
			if (err) {
				Logger.error('Error', err)
				reject(err)
			} else {
				Logger.info('Success', data.MessageId)
				resolve(data)
			}
		})
	})
}

export const userConsumer = Consumer.create({
	queueUrl: `${Config.AWS.SQS_QUEUE_URL}/User.fifo`,
	handleMessage: async (message) => {
		Logger.info('Inside User Queue: ', message)
	},
})

// Catching event when received. FYI This will be called before handle message
userConsumer.on('message_received', (msg) => {
	Logger.info('Inside message_received event of Consumer 1')
})

userConsumer.on('error', (err) => {
	Logger.info('Inside error event of consumer 1', err.message)
})

userConsumer.on('processing_error', (err) => {
	Logger.info('Inside processing_error event of consumer 1', err.message)
})

userConsumer.on('timeout_error', (err) => {
	Logger.info('Inside timeout_error event of consumer 1', err.message)
})
