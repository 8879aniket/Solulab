import { Router } from 'express'

import { createAdmin, updateAdmin } from '@dummy/admin/controller'

const router = Router()

router.post('/create', createAdmin)
router.put('/update/:userId', updateAdmin)

export default router
