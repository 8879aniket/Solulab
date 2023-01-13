import express from 'express'

import dummyRoute from '@dummy/index'
import projectsRoute from '@projects/route'
import health from '@middlewares/health'

const router = express.Router()

router.use('/health', health)
router.use('/dummy', dummyRoute)
router.use('/projects', projectsRoute)

export default router
