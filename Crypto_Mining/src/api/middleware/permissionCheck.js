/* eslint-disable func-names */
import mongoose from 'mongoose'
import { Role } from '../modules/admin/roleModel'
import { Admin } from '../modules/admin/adminModel'
import { routAccess } from '../helperFunction/role'

module.exports = {
	// verify token
	permissionCheck(routName) {
		return async function (req, res, next) {
			try {
				const admin = await Admin.findOne({ _id: req.userId })

				const rolePermission = await Role.findOne({
					_id: mongoose.Types.ObjectId(admin.role),
				})

				if (rolePermission == null) {
					return res.status(404).send({
						status: 'error',
						message:
							'your given role might be deleted or not exist',
					})
				}
				const allPermission = {
					adminManagement: admin.adminPermissions.adminManagement,
					roleManagement: admin.adminPermissions.roleManagement,
					inventoryManagement: rolePermission.inventoryManagement,
					userManagement: rolePermission.userManagement,
					orderManagement: rolePermission.orderManagement,
					// contentManagement: rolePermission.contentManagement,
					// platformVariable: rolePermission.platformVariable,
				}

				// allPermission = { adminPermission.adminManagement, }

				const allow = await routAccess(routName, allPermission)
				if (allow === false) {
					return res.status(401).send({
						status: 'error',
						message: "sorry you don't have this permission",
					})
				}

				return next()
			} catch (err) {
				return res.status(401).send(err.message)
			}
		}
	},
}
