import { Logger } from '@config/logger'
import { Request, Response } from 'express'

const health = (req: Request, res: Response) => {
    Logger.info('inside health middleware logger')
    res.status(200).send('The route is healthy')
}

export default health
