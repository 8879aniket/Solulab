import express from 'express'
import logger from '../../middleware/logger'
import {
	deleteAdmin,
	getDashboardData,
	totalRevenue,
	totalOrders,
	totalCustomers,
	totalGrowth,
	updateProfileImage,
	updateFullName,
	updateNumberVerifyOtp,
	emailAlreadyExist,
	creatProduct,
	getProduct,
	editProduct,
	deleteProduct,
	groupRemoveFromArchive,
	createAdmin,
	getAdmin,
	editAdmin,
	changeAdminStatus,
	getAllAdmin,
	createRole,
	editRole,
	// creatContent,
	// getAboutUs,
	// getPrivacy,
	// getTermsAndConditions,
	// editAboutUs,
	// editPrivacy,
	// editTermsAndConditions,
	getAllProduct,
	listOfUnArchiveProduct,
	listOfArchiveProduct,
	deleteRole,
	getRole,
	getAllRole,
	removeSignalImage,
	addSignalImage,
	getPlatformVariables,
	editPlatformVariables,
	getAllUser,
	getUser,
	changeUserStatus,
	getOrder,
	editOrderStatus,
	getAllOrder,
	getUserOrder,
	signIn,
	verifyOtp,
	updatePassword,
	addProductToArchive,
	removeProductFromArchive,
	sendOtp,
	getActivityLog,
	generateInvoice,
	forgotPassword,
	verifyForgotPasswordOtp,
	resetPassword,
	updateMobilesendOtp,
	updateMobileVerifyOtp,
} from './adminController'
import { permissionCheck } from '../../middleware/permissionCheck'
import { verifyAuthToken } from '../../middleware/auth'
import {
	uploadProductImages,
	uploadAdminImage,
} from '../../middleware/multerS3'

const router = express.Router()

router.post('/signIn', signIn)
router.post('/verifyOtp', verifyOtp)

// dashboard

router.get('/getDashboardData', [verifyAuthToken], getDashboardData)

router.get(
	'/getTotalRevenue',
	[verifyAuthToken, permissionCheck('createRole')],
	totalRevenue
)

router.get(
	'/getTotalOrders',
	[verifyAuthToken, permissionCheck('createRole')],
	totalOrders
)

router.get(
	'/getTotalCustomers',
	[verifyAuthToken, permissionCheck('createRole')],
	totalCustomers
)

router.get(
	'/getTotalGrowth',
	[verifyAuthToken, permissionCheck('createRole')],
	totalGrowth
)

// role
logger.info('-- Role Routes Initialized')
router.post(
	'/createRole',
	[verifyAuthToken, permissionCheck('createRole')],
	createRole
)

router.post(
	'/editRole',
	[verifyAuthToken, permissionCheck('editRole')],
	editRole
)

router.delete(
	'/deleteRole/:_id',
	[verifyAuthToken, permissionCheck('deleteRole')],
	deleteRole
)

router.get(
	'/getRole/:_id',
	[verifyAuthToken, permissionCheck('getRole')],
	getRole
)
//

router.get(
	'/getAllRole',
	[verifyAuthToken, permissionCheck('getAllRole')],
	getAllRole
)

// admin
logger.info('-- admin Routes Initialized')
router.post(
	'/createAdmin',
	// [verifyAuthToken, permissionCheck('createAdmin')],
	createAdmin
)

router.post(
	'/getAdmin',
	[verifyAuthToken, permissionCheck('getAdmin')],
	getAdmin
)

router.post(
	'/editAdmin',
	[verifyAuthToken, permissionCheck('editAdmin')],
	editAdmin
)

router.post(
	'/changeAdminStatus',
	[verifyAuthToken, permissionCheck('changeAdminStatus')],
	changeAdminStatus
)

router.get(
	'/getAllAdmin',
	[verifyAuthToken, permissionCheck('getAllAdmin')],
	getAllAdmin
)

router.post('/updateFullName', [verifyAuthToken], updateFullName)

router.post(
	'/updateProfileImage',
	[verifyAuthToken, uploadAdminImage],
	updateProfileImage
)

router.post(
	'/updateNumberVerifyOtp',
	[verifyAuthToken, uploadAdminImage],
	updateNumberVerifyOtp
)

router.delete(
	'/deleteAdmin/:userId',
	[verifyAuthToken, permissionCheck('deleteAdmin')],
	deleteAdmin
)

// product
logger.info('-- Product Routes Initialized')
router.post(
	'/createProduct',
	[verifyAuthToken, permissionCheck('createProduct'), uploadProductImages],
	creatProduct
)

router.get(
	'/getProduct/:_id',
	[verifyAuthToken, permissionCheck('getProduct')],
	getProduct
)

router.post(
	'/editProduct',
	[verifyAuthToken, permissionCheck('editProduct')],
	editProduct
)

router.delete(
	'/deleteProduct/:_id',
	[verifyAuthToken, permissionCheck('deleteProduct')],
	deleteProduct
)

router.get(
	'/getAllProduct',
	[verifyAuthToken, permissionCheck('getAllProduct')],
	getAllProduct
)

router.get(
	'/listOfUnArchiveProduct',
	[verifyAuthToken, permissionCheck('listOfUnArchiveProduct')],
	listOfUnArchiveProduct
)

router.get('/listOfArchiveProduct', [verifyAuthToken], listOfArchiveProduct)

router.post(
	'/removeSignalImage',
	[verifyAuthToken, permissionCheck('removeSignalImage')],
	removeSignalImage
)

router.post(
	'/addSignalImage',
	[verifyAuthToken, permissionCheck('addSignalImage'), uploadProductImages],
	addSignalImage
)

router.post(
	'/addProductToArchive',
	// [verifyAuthToken, permissionCheck('addProductToArchive')],
	addProductToArchive
)

router.post(
	'/removeProductFromArchive',
	[verifyAuthToken],
	removeProductFromArchive
)

router.post(
	'/groupRemoveFromArchive',
	// [verifyAuthToken, permissionCheck('removeProductFromArchive')],
	groupRemoveFromArchive
)

// content
// logger.info('-- content Routes Initialized')
// router.post('/createContent', creatContent)
// router.get('/getAboutUs',[verifyAuthToken, permissionCheck('getAllAdmin')], getAboutUs)
// router.get('/getPrivacy', getPrivacy)
// router.get('/getTermsAndConditions', getTermsAndConditions)
// router.post('/editAboutUs', editAboutUs)
// router.post('/editPrivacy', editPrivacy)
// router.post('/editTermsAndConditions', editTermsAndConditions)

// getPlatformVariables

router.get(
	'/getPlatformVariables',
	[verifyAuthToken, permissionCheck('getPlatformVariables')],
	getPlatformVariables
)

router.post(
	'/editPlatformVariables',
	[verifyAuthToken, permissionCheck('editPlatformVariables')],
	editPlatformVariables
)

// user Management

router.get('/getUser', [verifyAuthToken, permissionCheck('getUser')], getUser)

router.get(
	'/getAllUser',
	[verifyAuthToken, permissionCheck('getAllUser')],
	getAllUser
)

router.post('/changeUserStatus', [verifyAuthToken], changeUserStatus)

router.post('/updatePassword', [verifyAuthToken], updatePassword)

// order Management
router.get(
	'/getOrder/:order_id',
	[verifyAuthToken, permissionCheck('getOrder')],
	getOrder
)

router.post(
	'/editOrderStatus',
	[verifyAuthToken, permissionCheck('editOrderStatus')],
	editOrderStatus
)

router.get(
	'/getAllOrder',
	[verifyAuthToken, permissionCheck('getAllOrder')],
	getAllOrder
)

router.get(
	'/getUserOrder/:userID',
	[verifyAuthToken, permissionCheck('getUserOrder')],
	getUserOrder
)

//
router.get('/emailAlreadyExist', emailAlreadyExist)

router.post('/sendOtp', sendOtp)

router.get(
	'/getActivityLog/:userID',
	[verifyAuthToken, permissionCheck('getActivityLog')],
	getActivityLog
)

router.get(
	'/generateInvoice/:orderId',
	[verifyAuthToken, permissionCheck('generateInvoice')],
	generateInvoice
)

router.post('/forgotPassword', forgotPassword)

router.post('/verifyForgotPasswordOTP', verifyForgotPasswordOtp)

router.post('/resetPassword', resetPassword)

router.post('/updateMobilesendOtp', [verifyAuthToken], updateMobilesendOtp)

router.post('/updateMobileVerifyOtp', [verifyAuthToken], updateMobileVerifyOtp)

module.exports = router
