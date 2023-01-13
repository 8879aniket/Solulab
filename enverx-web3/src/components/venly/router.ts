import { Router } from 'express'
import {
	getChains,
	createBlockchainWallet,
	getBlockchainWallet,
	mintGTP,
	transferGTPMetaTransaction,
	mintVCC,
	swapMetaTransaction,
	getBlockchainWalletTransactions,
} from '@venly/controller'
import Authorize from '@middlewares/authorize'

const router = Router()

router.use(Authorize)
router.get('/getChains', getChains)
router.post('/createBlockchainWallet', createBlockchainWallet)
router.get('/getBlockchainWallet/:walletId', getBlockchainWallet)
router.post('/mintGTP', mintGTP)
router.post('/transferGTP', transferGTPMetaTransaction)
router.post('/mintVCC', mintVCC)
router.post('/swap', swapMetaTransaction)
router.get('/blockchain-wallet/:walletId/transactions', getBlockchainWalletTransactions)

export default router
