import { Request, Response } from 'express'
import { v4 as uuid } from 'uuid'
import { Logger } from '@config/logger'
import { errorHandler, responseHandler } from '@helpers/responseHandlers'
import User from '@dummy/admin/admin.model'

export const testController = async (req: Request, res: Response) => {
	Logger.info('Inside Test Controller')
	const { data } = req.body

	const result = await User.create(data)

	responseHandler({ res, data: result })
	try {
	} catch (error) {
		Logger.error(error)
	}
}

export const createAdmin = async (req: Request, res: Response) => {
	Logger.info('Inside createUser Controller')
	try {
		const { id, name, email }: { id: string; name: string; email: string } = req.body

		const userObject: { id: string; name: string; email: string } = {
			id: uuid(),
			name,
			email,
		}
		const user = await User.create(req.body)
		responseHandler({ res, data: user })
	} catch (err) {
		Logger.error(err)
	}
}

export const updateAdmin = async (req: Request, res: Response) => {
	Logger.info('Inside update admin controller')
	try {
		const { name, email } = req.body
		const { adminId } = req.params

		const result = await User.update(
			{ name, email },
			{
				where: {
					id: adminId,
				},
			}
		)

		responseHandler({ res, msg: 'Update Successfully!' })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, statusCode: 401, data: { error } })
	}
}
