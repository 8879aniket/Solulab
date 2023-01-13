import { ErrorHandlerInterface, ResponseHandlerInterface } from '@interfaces/responseHandler'

export const responseHandler = ({
	res,
	status = 200,
	msg = '',
	data = {},
	result = true,
}: ResponseHandlerInterface) => {
	res.status(status).send({ result, status, msg, data })
}

export const errorHandler = ({
	res,
	statusCode = 500,
	err = 'error',
	data = {},
	result = false,
}: ErrorHandlerInterface) => {
	res.status(statusCode).send({
		result,
		msg: err instanceof Error ? err.message : err,
		data,
	})
}
