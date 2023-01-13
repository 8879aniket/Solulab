import express from 'express'
import RootController from './rootController'

const router = express.Router()

router.get('/', RootController.getStatus)

module.exports = router
