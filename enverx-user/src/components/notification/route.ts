import { Router } from 'express'
import { getNotification } from './controller'
import Authorize from '@middlewares/authorize'

const router = Router()

router.use(Authorize)
router.get('/', getNotification)

export default router
