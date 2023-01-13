import express from 'express'
import circleRoute from '@circlePayment/route'
import dummyRoute from '@dummy/index'
import webhookRoute from '@webhook/route'
import health from '@middlewares/health'

const router = express.Router()
router.use('/health', health)
router.use('/circle', circleRoute)
router.use('/dummy', dummyRoute)
router.use('/webhook', webhookRoute)
export default router
