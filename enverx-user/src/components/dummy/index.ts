import express from 'express'
import userRoute from '@dummy/admin/route'

const router = express.Router()

router.use('/admin', userRoute)

export default router
