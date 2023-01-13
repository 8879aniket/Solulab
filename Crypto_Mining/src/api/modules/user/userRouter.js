import express from 'express'
import {
	getCountryList,
	checkEmailExist,
	postSignUp,
	verifyEmail,
	sendVerificationEmail,
	checkEmailVerified,
	signIn,
	sendOtpToMail,
	verifyOtp,
	post2Fa,
	generateQrCodeAndSecret,
	verifySecret,
	getRecoveryCode,
	sendResetPasswordMail,
	reset,
	resetPassword,
	getProfile,
	removeProfileImage,
	postProfile,
	updatePassword,
	createTicket,
	getUserTicket,
} from './userController'
import { verifyAuthToken } from '../../middleware/auth'
import {
	addToCart,
	getAllProduct,
	getCart,
	editCartQuantity,
	deleteCart,
	deleteFromCart,
	profitCalculator,
	getOrderSummary,
	getProduct,
} from './storeController'
import { getCards, postCard, updateCard, deleteCard } from './paymentController'
import { orderPlace, getOrders, payment } from './orderController'
import logger from '../../middleware/logger'
import { uploadUserImage } from '../../middleware/multerS3'

const router = express.Router()

router.get('/countryList', getCountryList)
router.post('/checkEmailExist', checkEmailExist)
router.post('/signUp', postSignUp)
router.post('/verifyEmail', verifyEmail)
router.post('/sendVerificationEmail', sendVerificationEmail)
router.post('/checkEmailVerified', checkEmailVerified)
router.post('/signIn', signIn)
router.post('/sendOtpToMail', sendOtpToMail)
router.post('/verifyOtp', verifyOtp)
router.post('/post2FaType', post2Fa)
router.post('/secret', generateQrCodeAndSecret)
router.post('/verifySecret', verifySecret)
router.post('/getRecoveryCode', getRecoveryCode)
router.post('/sendResetPasswordMail', sendResetPasswordMail)
router.post('/reset', reset)
router.post('/resetPassword', resetPassword)
router.get('/getProfile', [verifyAuthToken], getProfile)
router.post('/removeProfileImage', [verifyAuthToken], removeProfileImage)
router.post('/updateProfile', [verifyAuthToken], uploadUserImage, postProfile)
router.post('/updatePassword', [verifyAuthToken], updatePassword)
router.post('/createTicket', [verifyAuthToken], createTicket)
router.get('/getUserTicket', [verifyAuthToken], getUserTicket)

// store api

router.post('/getProduct', getProduct)
router.post('/getAllProduct', getAllProduct)
router.post('/addToCart', [verifyAuthToken], addToCart)
router.get('/getCart', [verifyAuthToken], getCart)
router.post('/editCartQuantity', [verifyAuthToken], editCartQuantity)
router.post('/deleteFromCart', [verifyAuthToken], deleteFromCart)
router.post('/deleteCart', [verifyAuthToken], deleteCart)
// router.post('/getProduct',[verifyAuthToken],getProduct)

router.get('/orderSummary', [verifyAuthToken], getOrderSummary)

router.post('/profitCalculator', profitCalculator)

// payment api
router.get('/getCards', [verifyAuthToken], getCards)
router.post('/saveCard', [verifyAuthToken], postCard)
router.post('/updateCard', [verifyAuthToken], updateCard)
router.post('/deleteCard', [verifyAuthToken], deleteCard)
router.post('/payment', [verifyAuthToken], payment)

// order routes
router.post('/orderPlace', [verifyAuthToken], orderPlace)
router.get('/getOrders', [verifyAuthToken], getOrders)
logger.info('-- user Routes Initialized')

module.exports = router
