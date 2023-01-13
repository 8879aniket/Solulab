import express from 'express'
import userRoute from '@dummy/user/route'
import adminRoute from '@dummy/admin/route'

const router = express.Router()
router.use('/user', userRoute)
router.use('/admin', adminRoute)

export default router
