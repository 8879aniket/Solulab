import { Router } from 'express'

import { testController, createAdmin, updateAdmin } from '@dummy/admin/controller'

const router = Router()

router.post('/test', testController)

router.post('/create', createAdmin)
router.post('/updateAdmin/:adminId', updateAdmin)

export default router
