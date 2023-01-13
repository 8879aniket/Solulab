import express from 'express'
import { authCheck } from '../../middleware/auth.js'
import {
	initiateLogin,
	login,
	updateMobileNumber,
	verifyUpdateMobileOTP,
	verifyOtp,
	forgotPassword,
	resetPassword,
	getPlayer,
	getAllPlayers,
	userMuteStatus,
	updateAdminProfile,
	changePassword,
	getAllFragments,
	getFragment,
	getAllTradingHistory,
	getTradingHistory,
	getDashboardData,
	getAllFAQ,
	getFAQ,
	deleteFAQ,
	createFAQ,
	updateFAQ,
	getAllBlog,
	getBlog,
	deleteBlog,
	createBlog,
	updateBlog,
	updateSupportReq,
	getSupportReq,
	getAllSupportReq,
	updateAdminProfilePic,
	updateBlogPic,
} from './adminController.js'
import uploadData from '../../middleware/multerS3.js'

const router = express.Router()

// Auth Route
router.post('/initiateLogin', initiateLogin)
router.post('/login', login)
router.post('/verifyOtp', verifyOtp)
router.post('/forgotPassword', forgotPassword)
router.post('/resetPassword/:token', resetPassword)
router.put('/changePassword', changePassword)
router.put('/profilePic', authCheck, uploadData.single('adminProfilePic'), updateAdminProfilePic)

router.post('/updateMobileNumber', authCheck, updateMobileNumber)
router.post('/verifyUpdatedMobileOTP', authCheck, verifyUpdateMobileOTP)

router.get('/player/:id', getPlayer)
router.get('/player', getAllPlayers)
router.post('/userMuteStatus', authCheck, userMuteStatus)
router.put('/updateAdminProfile', authCheck, updateAdminProfile)

router.get('/fragment', getAllFragments)
router.get('/fragment/:id', getFragment)

router.get('/tradingHistory', getAllTradingHistory)
router.get('/tradingHistory/:id', getTradingHistory)
router.get('/dashboard', getDashboardData)

// FAQ
router.get('/faq', getAllFAQ)
router.get('/faq/:id', getFAQ)
router.post('/faq', authCheck, createFAQ)
router.put('/faq/:id', authCheck, updateFAQ)
router.delete('/faq/:id', authCheck, deleteFAQ)

// Blog
router.get('/blog', getAllBlog)
router.get('/blog/:id', getBlog)
router.post('/blog', authCheck, uploadData.single('blogPic'), createBlog)
router.put('/blog/:id', authCheck, updateBlog)
router.delete('/blog/:id', authCheck, deleteBlog)
router.put('/updateBlogPic/:id', authCheck, uploadData.single('blogPic'), updateBlogPic)

// SupportRequest
router.get('/supportReq', getAllSupportReq)
router.get('/supportReq/:id', getSupportReq)
router.put('/supportReq/:id', authCheck, updateSupportReq)

export default router
