module.exports = {
	routAccess: (routeName, permissions) => {
		console.log(routeName, permissions)
		let access = false

		if (
			routeName === 'createRole' &&
			permissions.roleManagement.add === true
		) {
			access = true
			return access
		}

		if (
			routeName === 'editRole' &&
			permissions.roleManagement.edit === true
		) {
			access = true
			return access
		}

		if (
			routeName === 'deleteRole' &&
			permissions.roleManagement.delete === true
		) {
			access = true
			return access
		}

		if (
			routeName === 'getRole' &&
			permissions.roleManagement.view === true
		) {
			access = true
			return access
		}

		if (
			routeName === 'getAllRole' &&
			permissions.roleManagement.view === true
		) {
			access = true
			return access
		}

		if (
			routeName === 'createAdmin' &&
			permissions.adminManagement.add === true
		) {
			access = true
			return access
		}

		if (
			routeName === 'getAdmin' &&
			permissions.adminManagement.view === true
		) {
			access = true
			return access
		}

		if (
			routeName === 'editAdmin' &&
			permissions.adminManagement.edit === true
		) {
			access = true
			return access
		}

		if (
			routeName === 'changeAdminStatus' &&
			permissions.adminManagement.disable === true
		) {
			access = true
			return access
		}

		if (
			routeName === 'getAllAdmin' &&
			permissions.adminManagement.view === true
		) {
			access = true
			return access
		}

		if (
			routeName === 'deleteAdmin' &&
			permissions.adminManagement.delete === true
		) {
			access = true
			return access
		}

		if (
			routeName === 'createProduct' &&
			permissions.inventoryManagement.add === true
		) {
			access = true
			return access
		}

		if (
			routeName === 'getProduct' &&
			permissions.inventoryManagement.view === true
		) {
			access = true
			return access
		}

		if (
			routeName === 'editProduct' &&
			permissions.inventoryManagement.edit === true
		) {
			access = true
			return access
		}

		if (
			routeName === 'deleteProduct' &&
			permissions.inventoryManagement.delete === true
		) {
			access = true
			return access
		}

		if (
			routeName === 'getAllProduct' &&
			permissions.inventoryManagement.view === true
		) {
			access = true
			return access
		}

		if (
			routeName === 'listOfUnArchiveProduct' &&
			permissions.inventoryManagement.delete === true
		) {
			access = true
			return access
		}

		if (
			routeName === 'listOfArchiveProduct' &&
			permissions.inventoryManagement.delete === true
		) {
			access = true
			return access
		}

		if (
			routeName === 'removeSignalImage' &&
			permissions.inventoryManagement.edit === true
		) {
			access = true
			return access
		}

		if (
			routeName === 'addSignalImage' &&
			permissions.inventoryManagement.edit === true
		) {
			access = true
			return access
		}

		if (
			routeName === 'getUser' &&
			permissions.userManagement.view === true
		) {
			access = true
			return access
		}

		if (
			routeName === 'getAllUser' &&
			permissions.userManagement.view === true
		) {
			access = true
			return access
		}

		if (
			routeName === 'changeUserStatus' &&
			permissions.userManagement.edit === true
		) {
			access = true
			return access
		}

		if (
			routeName === 'getOrder' &&
			permissions.orderManagement.view === true
		) {
			access = true
			return access
		}

		if (
			routeName === 'editOrderStatus' &&
			permissions.orderManagement.edit === true
		) {
			access = true
			return access
		}

		if (
			routeName === 'getAllOrder' &&
			permissions.orderManagement.view === true
		) {
			access = true
			return access
		}

		if (
			routeName === 'getUserOrder' &&
			permissions.orderManagement.view === true
		) {
			access = true
			return access
		}

		if (
			routeName === 'getPlatformVariables' &&
			permissions.platformVariable.view === true
		) {
			access = true
			return access
		}

		if (
			routeName === 'editPlatformVariables' &&
			permissions.platformVariable.edit === true
		) {
			access = true
			return access
		}

		if (
			routeName === 'getActivityLog' &&
			permissions.orderManagement.view === true
		) {
			access = true
			return access
		}

		if (
			routeName === 'generateInvoice' &&
			permissions.orderManagement.view === true
		) {
			access = true
			return access
		}

		return access
	},
}
