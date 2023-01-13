import express from 'express'
import venlyRoute from '@venly/router'
import health from '@middlewares/health'

const router = express.Router()

router.get('/web3/health', health)
router.use('/venly', venlyRoute)

export default router
