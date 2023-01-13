import express from 'express'
import authController from './authController'

const router = express.Router()

router.post('/signin', Validator(SignInBody), authController.signIn)
router.post('/verify_otp', Validator(VerifyOtpBody), authController.verifyOtp)
router.get('/', authController.rootHandler)

module.exports = router
