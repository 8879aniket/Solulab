import { Router } from 'express'

import { generateTokenRequest, verifyTokenRequest } from '@auth/controller'

const router = Router()

router.post('/generateToken', generateTokenRequest)
router.get('/verifyToken', verifyTokenRequest)

export default router
