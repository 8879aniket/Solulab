import express from 'express'
import {
	getAllFragments,
	getFragment,
	getAllSellFragments,
	getAllSellFragmentsMarket,
} from './fragmentController.js'

const router = express.Router()

router.get('/', getAllFragments)
router.get('/onsale', getAllSellFragments)
router.get('/market', getAllSellFragmentsMarket)
router.get('/view/:id', getFragment)

export default router
