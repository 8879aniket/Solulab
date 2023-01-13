import express from 'express'
import { circleHead, circlePost } from '@webhook/controller'

const router = express.Router()

router.head('/circle', circleHead)
router.post('/circle', circlePost)

export default router
