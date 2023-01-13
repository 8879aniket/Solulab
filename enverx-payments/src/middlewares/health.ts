import { Logger } from '@config/logger'
import { Request, Response } from 'express'

const health = (req: Request, res: Response) => {
	res.status(200).send('The route is healthy')
}

export default health
