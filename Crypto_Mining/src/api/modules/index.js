import express from 'express'
import adminRoutes from './admin/adminRouter'
import userRoutes from './user/userRouter'

const router = express.Router()

router.use('/admin', adminRoutes)
router.use('/user', userRoutes)

module.exports = router