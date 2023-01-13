import cron from 'node-cron'
import { Logger } from '@config/logger'
import { updateEchoSubscription } from '@user/service'

const executeCrons = async () => {
	cron.schedule('0 0 * * *', async () => {
		const thisDate = new Date()
		Logger.info(`Cron Job is working to start Echo Subscription ${thisDate}`)
		await updateEchoSubscription(
			{
				isEchoSubscribed: true,
			},
			{
				echoStartDate: thisDate,
			}
		)
	})

	cron.schedule('59 23 * * *', async () => {
		const thisDate = new Date()
		Logger.info(`Cron Job is working to end Echo Subscription ${thisDate}`)
		await updateEchoSubscription(
			{
				isEchoSubscribed: false,
			},
			{
				echoEndDate: thisDate,
			}
		)
	})
}

export default executeCrons
