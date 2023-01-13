import express from 'express'
import { authCheck } from '../../middleware/auth.js'
import { getAllSupportReq, getSupportReq, createSupportReq } from './supportReqController.js'
import uploadData from '../../middleware/multerS3.js'

const router = express.Router()
router.get('/', getAllSupportReq)
router.get('/:id', getSupportReq)
router.post('/', authCheck, uploadData.array('images'), createSupportReq)

export default router
