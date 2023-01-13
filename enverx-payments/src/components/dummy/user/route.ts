import { Router } from 'express'

import {
	createUserApi,
	createDummyBankAccount,
	updateUserApi,
} from '@dummy/user/controller'

const router = Router()

router.post('/create', createUserApi)
router.put('/update/:userId', updateUserApi)
router.post('/createBankAccount', createDummyBankAccount)

export default router
