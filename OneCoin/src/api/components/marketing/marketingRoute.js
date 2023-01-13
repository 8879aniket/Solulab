import express from 'express'

import {
	login,
	createUser,
	getUserDetails,
	getDashboard,
	getRoundDetails,
} from './marketingController.js'

const router = express.Router()

router.post('/login', login)
router.post('/create-user', createUser)
router.get('/get-user', getUserDetails)
router.get('/get-dashboard', getDashboard)
router.get('/get-rounds', getRoundDetails)

export default router
