import { Router } from 'express'
import {
	createUserApi,
	login,
	verifyLogin,
	forgotPassword,
	resetPassword,
	updateUser,
	sendEmailOtp,
	sendMobileotp,
	createBankAccount,
	getBankAccount,
	createWallet,
	updateBankDetail,
	createACHBankAccount,
	updateACHBankDetail,
	deleteBankAccount,
	getUser,
	accountProgress,
	getAllUser,
	verifyMobileNo,
	updateUserStatus,
	getUserByAuth,
	getEchoUsers,
	updateEchoUser,
	getEchoSubscriberCount,
	createEchoUser,
	updatePriceLastUpdated,
	createNewUser,
	twoFAUpdateRequest,
	verifySecurityUpdate,
	newUserLogin,
	verifyEmail,
	sendEmailVerification,
	userVerifyLogin,
	updateUserKYB,
} from '@user/controller'
import Authorize from '@middlewares/authorize'
import checkIsAdmin from '@middlewares/checkIsAdmin'
import checkOTPLimit from '@middlewares/checkOTPLimit'
import checkPasswordChanged from '@middlewares/checkPasswordChanged'

const router = Router()

router.post('/create', createUserApi)
router.post('/login', checkOTPLimit, login)
router.post('/verify', verifyLogin)
router.post('/emailOtp', checkOTPLimit, sendEmailOtp)
router.post('/forgotPassword', checkOTPLimit, forgotPassword)
router.put('/resetPassword', resetPassword)
router.put('/updateBankDetail', updateBankDetail)
router.put('/updateACHBankDetail', updateACHBankDetail)
router.post('/new-user', createNewUser)
router.post('/user-login', newUserLogin)
router.post('/verifyEmail', verifyEmail)
router.post('/sendEmailVerification', sendEmailVerification)
router.post('/userVerifyLogin', userVerifyLogin)

router.use(Authorize)
router.get('/getUser/:userId', checkIsAdmin, getUser)
router.get('/getAllUser', checkIsAdmin, getAllUser)
router.put('/updateUserStatus/:userId', checkIsAdmin, updateUserStatus)
router.get('/echo', checkIsAdmin, getEchoUsers)
router.patch('/echo/:userId', checkIsAdmin, updateEchoUser)
router.get('/echo/subscriber-count', getEchoSubscriberCount)
router.post('/echo', checkIsAdmin, createEchoUser)

router.use(checkPasswordChanged)
router.put('/updateMobile', checkOTPLimit, sendMobileotp)
router.post('/verifyMobile', verifyMobileNo)
router.get('/getUserProfile', getUserByAuth)
router.get('/accountProgress', accountProgress)
router.put('/updateUser', updateUser)
router.post('/createBankAccount', createBankAccount)
router.get('/getBankAccount/:type', getBankAccount)
router.post('/createWallet', createWallet)
router.post('/createACHBankAccount', createACHBankAccount)
router.put('/deleteBankAccount/:accountId', deleteBankAccount)
router.patch('/price-updated-date', updatePriceLastUpdated)
router.post('/twoFA-request', twoFAUpdateRequest)
router.post('/verify-twoFA', verifySecurityUpdate)
router.patch('/kyb', updateUserKYB)

export default router
