import axios from 'axios'
import { Logger } from '@config/logger'

import { errorHandler, responseHandler } from '@helpers/responseHandlers'
import { Request, Response } from 'express'
import MessageValidator from 'sns-validator'
import Messages from '@helpers/messages'
import Config from '@config/config'
import {
	updateWirePayment,
	updateTransferAndPayout,
	updateACHPayment,
	createTransferAfterWirePayment,
	getWireTransactionData,
	getACHTransactionData,
	createTransferAfterACHPayment,
	updateWirePaymentAfterConfirm,
} from '@webhook/service'

export const circleHead = async (req: Request, res: Response) => {
	Logger.info('Inside circle Head request controller.')
	return responseHandler({ res })
}

export const circlePost = async (req: Request, res: Response) => {
	try {
		Logger.info('Inside circle Post request Controller')

		const validator = new MessageValidator()

		const circleArn = /^arn:aws:sns:.*:908968368384:(sandbox|prod)_platform-notifications-topic$/

		let body = ''
		req.on('data', (data) => {
			body += data
		})
		req.on('end', () => {
			handleBody(body)
		})

		const handleBody = async (body: any) => {
			const envelope = JSON.parse(body)
			validator.validate(envelope, async (err: any) => {
				if (err) {
					Logger.error(err)
				} else {
					switch (envelope.Type) {
						case 'SubscriptionConfirmation': {
							if (!circleArn.test(envelope.TopicArn)) {
								Logger.error(
									`\nUnable to confirm the subscription as the topic arn is not expected ${envelope.TopicArn}. Valid topic arn must match ${circleArn}.`
								)
								return errorHandler({ res })
							}
							axios
								.get(envelope.SubscribeURL)
								.then(() => {
									Logger.info('Subscription confirmed.')
								})
								.catch((err) => {
									Logger.error('Subscription NOT confirmed.', err)
								})
							return responseHandler({ res })
						}
						case 'Notification': {
							Logger.info(`Inside Notification webhook`)
							// Logger.info(`Received message ${envelope.Message}`)
							const notification = JSON.parse(envelope.Message)
							switch (notification.notificationType) {
								case 'wire': {
									let circleError: boolean = false
									let errMessage: string = ''
									const payload = {
										accountId: notification.wire.id,
										status: notification.wire.status,
										trackingRef: notification.wire.trackingRef,
									}
									await axios.put(`${Config.USER.UPDATE_BANK_ACCOUNT}`, payload).catch((err) => {
										Logger.error(err)
										circleError = true
										errMessage = err.response.data.msg
									})
									if (circleError) {
										Logger.error(errMessage)
									}
									await axios.put(`${Config.ADMIN.UPDATE_BANK_ACCOUNT}`, payload).catch((err) => {
										Logger.error(err)
										circleError = true
										errMessage = err.response.data.msg
									})
									if (circleError) {
										Logger.error(errMessage)
									}
									break
								}
								case 'payments': {
									const trackingRef: string = notification.payment.trackingRef
									const amount: number = parseFloat(notification.payment.amount.amount)
									const currency: string = notification.payment.amount.currency
									const transactionType: string = 'PAYMENT'
									const status: string = notification.payment.status
									const transactionId: string = notification.payment.id
									const merchantWalletId: string = notification.payment.merchantWalletId
									// const fees: number = parseFloat(notification.payment.fees.amount)
									let circleError: boolean = false
									let errMessage: string = ''
									const platformData: any = await axios
										.get(`${Config.ADMIN.GET_PLATFORM_VARIABLE}/Wire Payment fees`)
										.catch((err) => {
											Logger.error(err)
											circleError = true
											errMessage = err.response.data.msg
										})
									if (circleError) {
										Logger.error(errMessage)
									}
									const wirePaymentFees = platformData.data.data.values
									const fees = wirePaymentFees ? wirePaymentFees : 16
									if (notification.payment?.source?.type === 'ach') {
										const transactionData = await getACHTransactionData(
											transactionId,
											transactionType
										)
										if (!transactionData) {
											Logger.error(Messages.TRANSACTION_DATA_NOT_FOUND)
											return
										}
										if (status === 'confirmed') {
											if (transactionData?.status !== 'paid') {
												const result: any = await updateACHPayment(
													trackingRef,
													transactionType,
													transactionId,
													amount,
													fees
												)
												if (result === null) {
													Logger.error(Messages.UPDATE_ACH_PAYMENT_FAILED)
													return
												}
												const resultData = await createTransferAfterACHPayment(
													transactionId,
													amount,
													currency,
													transactionType,
													merchantWalletId,
													fees
												)
												if (resultData === null) {
													Logger.error(Messages.CREATE_TRANSFER_AFTER_ACH_PAYMENT_FAILED)
													return
												}
											}
										}
									} else {
										if (status === 'paid') {
											const transactionData = await getWireTransactionData(
												trackingRef,
												transactionId,
												transactionType
											)
											if (!transactionData) {
												const status = 'confirmed'
												const result = await updateWirePayment(
													trackingRef,
													amount,
													currency,
													transactionType,
													status,
													transactionId,
													fees
												)
												if (result === null) {
													Logger.error(Messages.UPDATE_WIRE_PAYMENT_FAILED)
													return
												}
												return
											}
											if (transactionData?.status === 'paid') {
												const result = await updateWirePayment(
													trackingRef,
													amount,
													currency,
													transactionType,
													status,
													transactionId,
													fees
												)
												if (result === null) {
													Logger.error(Messages.UPDATE_WIRE_PAYMENT_FAILED)
												}
											} else {
												const result = await updateWirePayment(
													trackingRef,
													amount,
													currency,
													transactionType,
													status,
													transactionId,
													fees
												)
												if (result === null) {
													Logger.error(Messages.UPDATE_WIRE_PAYMENT_FAILED)
												}
												const resultData = await createTransferAfterWirePayment(
													transactionId,
													amount,
													currency,
													transactionType,
													merchantWalletId,
													wirePaymentFees
												)
												if (resultData === null) {
													Logger.error(Messages.CREATE_TRANSFER_AFTER_WIRE_PAYMENT_FAILED)
												}
											}
										} else {
											const result = await updateWirePayment(
												trackingRef,
												amount,
												currency,
												transactionType,
												status,
												transactionId,
												fees
											)
											if (result === null) {
												Logger.error(Messages.UPDATE_WIRE_PAYMENT_FAILED)
											}
											return
										}
									}
									break
								}
								case 'transfers': {
									const amount: number = parseFloat(notification.transfer.amount.amount)
									const currency: string = notification.transfer.amount.currency
									const transactionType: string = 'TRANSFER'
									const status: string = notification.transfer.status
									const transactionId: string = notification.transfer.id
									const result = await updateTransferAndPayout(
										amount,
										currency,
										transactionType,
										status,
										transactionId
									)
									if (result === null) {
										Logger.error(Messages.UPDATE_TRANSFER_FAILED)
									}
									break
								}
								case 'payouts': {
									const amount: number = parseFloat(notification.payout.amount.amount)
									const currency: string = notification.payout.amount.currency
									const transactionType: string = 'PAYOUT'
									const status: string = notification.payout.status
									const transactionId: string = notification.payout.id
									const result = await updateTransferAndPayout(
										amount,
										currency,
										transactionType,
										status,
										transactionId
									)
									if (result === null) {
										Logger.error(Messages.UPDATE_PAYOUT_FAILED)
									}
									break
								}
								case 'ach': {
									let circleError: boolean = false
									let errMessage: string = ''
									const payload = {
										accountId: notification.ach.id,
										status: notification.ach.status,
										accountNumber: notification.ach.accountNumber,
										routingNumber: notification.ach.routingNumber,
										description: notification.ach.description,
										bankName: notification.ach.bankAddress.bankName,
										line1: notification.ach.bankAddress.line1,
										city: notification.ach.bankAddress.city,
										district: notification.ach.bankAddress.district,
										country: notification.ach.bankAddress.country,
										fingerprint: notification.ach.fingerprint,
									}

									await axios
										.put(`${Config.USER.UPDATE_ACH_BANK_ACCOUNT}`, payload)
										.catch((err) => {
											Logger.error(err)
											circleError = true
											errMessage = err.response.data.msg
										})
									if (circleError) {
										Logger.error(errMessage)
									}
									await axios
										.put(`${Config.ADMIN.UPDATE_ACH_BANK_ACCOUNT}`, payload)
										.catch((err) => {
											Logger.error(err)
											circleError = true
											errMessage = err.response.data.msg
										})
									if (circleError) {
										Logger.error(errMessage)
									}
									break
								}
								default: {
									Logger.error(`Message of type ${body.Type} not supported`)
									return
								}
							}
						}
						default: {
							return
						}
					}
				}
			})
		}
	} catch (error: any) {
		Logger.error(error)
		return errorHandler({ res, err: error.message })
	}
}
