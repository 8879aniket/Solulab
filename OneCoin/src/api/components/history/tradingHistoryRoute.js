import express from 'express'
import { getAllTradingHistory, getTradingHistory } from './tradingHistoryController.js'

const router = express.Router()

router.get('/', getAllTradingHistory)
router.get('/:id', getTradingHistory)

export default router
