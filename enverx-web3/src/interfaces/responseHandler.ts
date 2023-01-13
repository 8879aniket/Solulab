import { Response } from 'express'

export interface ResponseHandlerInterface {
	res: Response
	status?: number
	msg?: string
	data?: object
	result?: boolean
}

export interface ErrorHandlerInterface {
	res: Response
	statusCode?: number
	err?: Error | string
	data?: object
	result?: boolean
}
