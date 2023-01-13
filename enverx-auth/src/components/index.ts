import express from 'express'
import authRoute from '@auth/route'
import health from '@middlewares/health'

const router = express.Router()

router.get('/auth/health', health)
router.use('/auth', authRoute)

export default router
