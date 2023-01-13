import express from 'express'
import { getAllBlog, getBlog } from './blogController.js'

const router = express.Router()

router.get('/', getAllBlog)
router.get('/:id', getBlog)

export default router
