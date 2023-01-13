import express from 'express'
import { getAllFAQ, getFAQ } from './faqController.js'

const router = express.Router()

router.get('/', getAllFAQ)
router.get('/:id', getFAQ)

export default router
