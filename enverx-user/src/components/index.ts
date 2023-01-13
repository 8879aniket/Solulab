import express from 'express'
import dummyRoute from '@dummy/index'
import userRoute from '@user/route'
import notificationRoute from '@notification/route'
import health from '@middlewares/health'
const router = express.Router()

router.get('/user/health', health)
router.use('/dummy', dummyRoute)
router.use('/user', userRoute)
router.use('/notification', notificationRoute)

export default router
