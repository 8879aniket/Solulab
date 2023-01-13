import express from 'express'
import { getCMSData, updateCMSData } from './cmsController.js'

const router = express.Router()

router.get('/', getCMSData)
router.put('/update', updateCMSData)

export default router
