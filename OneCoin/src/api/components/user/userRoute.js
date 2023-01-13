/* eslint-disable func-names */
/* eslint-disable object-shorthand */
import express from 'express'
import multer from 'multer'
import { authCheck, byPassAuth } from '../../middleware/auth.js'
import {
	login,
	logout,
	getUser,
	updateMe,
	updateUser,
	deleteUser,
	getAllUsers,
	leaderBoardData,
	claimAcheivement,
	getAcheivement,
	getMe,
	getAllActivity,
	getUserActivity,
	updatePrivacySettingApi,
	updateProfilePic,
	updateCoverPic,
	generateCoordinate,
	getSuggestion,
	possibleMerge,
	createSought,
	subscribeNewsletter,
	unsubscribeNewsletter,
	pusblishNews,
} from './userController.js'
import uploadData from '../../middleware/multerS3.js'

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const router = express.Router()

router.post('/login', login)
router.get('/logout', logout)
router.get('/leaderBoardData', byPassAuth, leaderBoardData)
router.get('/suggestion', authCheck, getSuggestion)
router.get('/possibleMerge', authCheck, possibleMerge)

router.get('/me', authCheck, getMe, getUser)
router.get('/profile/:id', getUser)
router.put('/updateProfile', authCheck, updateMe)
router.get('/activity', getAllActivity)
router.get('/userAcivity', authCheck, getUserActivity)

router.put('/claimAcheivement', authCheck, claimAcheivement)
router.get('/acheivement', getAcheivement)
router.put('/privacySetting', authCheck, updatePrivacySettingApi)
// router.use(authController.restrictTo('admin'));
router.put('/profilePic', authCheck, uploadData.single('profilePic'), updateProfilePic)
router.put('/coverPic', authCheck, uploadData.single('coverPic'), updateCoverPic)
router.get('/mint/:noOfCoordinate', authCheck, generateCoordinate)

router.post('/sought', authCheck, createSought)

router.get('/subscribeNewsletter', subscribeNewsletter)
router.get('/unsubscribeNewsletter', unsubscribeNewsletter)
router.post('/pusblishNews', upload.single('newsletter'), pusblishNews)

router.route('/').get(getAllUsers)

router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser)

export default router
