import { Router } from 'express'

import UserRoute from '@dummy/user/route'

const router = Router()

router.use('/user', UserRoute)

export default router
