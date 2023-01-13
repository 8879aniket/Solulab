import { Router } from 'express'

import {
	balance,
	createBankAccount,
	createWallet,
	createWirePayment,
	getWalletDetails,
	createTransfer,
	createPayout,
	getAllTransactionHistory,
	getPlaidLinkToken,
	createAccessToken,
	createACHBankAccount,
	createACHPayment,
	getWalletbalance,
	getAllWallet,
	getPlatformTransactionHistory,
	getAllTransactionByWalletId,
	updateTransaction,
} from '@circlePayment/controller'
import Authorize from '@middlewares/authorize'

const router = Router()

router.use(Authorize)
router.get('/getbalance', balance)
router.post('/createBankAccount', createBankAccount)
router.post('/createWallet', createWallet)
router.post('/createWirePayment', createWirePayment)
router.get('/getWalletDetails', getWalletDetails)
router.post('/createTransfer', createTransfer)
router.post('/createPayout', createPayout)
router.get('/getAllTransactionHistory', getAllTransactionHistory)
router.get('/getPlaidLinkToken', getPlaidLinkToken)
router.post('/createAccessToken', createAccessToken)
router.post('/createACHBankAccount', createACHBankAccount)
router.post('/createACHPayment', createACHPayment)
router.get('/getWalletbalance/:walletId', getWalletbalance)
router.get('/getAllWallet', getAllWallet)
router.get('/getPlatformTransactionHistory', getPlatformTransactionHistory)
router.get('/getAllTransactionByWalletId/:walletId', getAllTransactionByWalletId)
router.put('/updateTransaction', updateTransaction)

export default router
