import Bull from 'bull'
// eslint-disable-next-line import/no-cycle
import mintNFt from '../components/websockets/blockchainEvent.js'
import config from '../config/config.js'
import logger from '../config/logger.js'

const processQueue = new Bull('mint', {
	redis: {
		host: config.redisHost,
		port: config.redisPort,
	},
})

const onceReady = (redisInstance) => {
	if (redisInstance.status === 'ready') {
		logger.info('Redis connection established, Ready to go...')
		return
	}
	return setTimeout(() => {
		logger.info('Redis connection not yet established, retrying...')
		return onceReady(redisInstance)
	}, 500)
}
onceReady(processQueue.clients[0])

processQueue.process(async (job) => {
	return mintNFt(job.data)
})

export default processQueue
