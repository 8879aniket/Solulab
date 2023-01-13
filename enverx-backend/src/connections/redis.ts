import Redis, { Cluster } from 'ioredis'
import { Logger } from '@config/logger'
import Config from '@config/config'

let redis: Cluster

export let subClient: Cluster

if (Config.REDIS_ENVIRONMENT === 'local') {
	redis = new Redis.Cluster(Config.REDIS_CLUSTER_PATH, {
		dnsLookup: (address, callback) => callback(null, address),
		redisOptions: {},
		lazyConnect: true,
	})

	subClient = redis.duplicate()
} else {
	redis = new Redis.Cluster(
		[
			{
				host: Config.REDIS_CLUSTER_PATH[0],
				port: 6379,
			},
			{
				host: Config.REDIS_CLUSTER_PATH[1],
				port: 6379,
			},
			{
				host: Config.REDIS_CLUSTER_PATH[2],
				port: 6379,
			},
		],
		{
			dnsLookup: (address, callback) => callback(null, address),
			redisOptions: {
				password: Config.REDIS_CLUSTER_PASSWORD,
				tls: {},
			},
			lazyConnect: true,
		}
	)

	subClient = redis.duplicate()
}

redis
	.on('connect', async () => {
		Logger.info('redis connected', 'info')
	})
	.on('ready', () => {
		Logger.info('redis Ready', 'info')
	})
	.on('error', (e) => {
		Logger.info(e, 'error')
	})
	.on('close', () => {
		Logger.info('Redis close', 'info')
	})
	.on('reconnecting', () => {
		Logger.info('Redis reconnecting', 'info')
	})
	.on('end', () => {
		Logger.info('Redis end', 'info')
	})

export default redis
