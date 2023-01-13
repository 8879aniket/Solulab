import { Logger } from '@config/logger'
import messages from '@helpers/messages'
import { errorHandler } from '@helpers/responseHandlers'
import { NextFunction, Request, Response } from 'express'

export default async (req: Request, res: Response, next: NextFunction) => {
    Logger.info('Inside check isAdmin Authorize middleware')
    const { accountType } = req.user
    if (accountType === 'USER') {
        return errorHandler({ res, statusCode: 401, err: messages.UNAUTHORIZE })
    }
    next()
}
