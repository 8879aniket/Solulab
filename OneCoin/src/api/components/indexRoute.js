import express from 'express'
import user from './user/userRoute.js'
import admin from './admin/adminRoute.js'
import marketing from './marketing/marketingRoute.js'
import fragment from './fragment/fragmentRoute.js'
import tradingHistory from './history/tradingHistoryRoute.js'
import faq from './faq/faqRoute.js'
import blog from './blogs/blogRoute.js'
import cmsRoute from './cms/cmsRoute.js'
import supportReq from './supportRequest/supportReqRoute.js'

const router = express.Router()

router.use('/user', user)
router.use('/fragment', fragment)
router.use('/tradingHistory', tradingHistory)
router.use('/faq', faq)
router.use('/blog', blog)
router.use('/supportReq', supportReq)
router.use('/admin', admin)
router.use('/marketing', marketing)
router.use('/cms', cmsRoute)

export default router
