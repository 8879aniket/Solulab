import { Response, Request } from 'express'
import _, { truncate } from 'lodash'
import { v4 as uuid } from 'uuid'
import {
	validateProject,
	validateProjectApproval,
	updateProjectByAdminValidation,
	preVerificationApprovalValidation,
	liveSeedProjectValidation,
	preVerificationSuccessValidation,
	fullVerificationSuccessValidation,
	createWithdrawRequestValidation,
	addSeedVccCreditsValidation,
	updateVvbRegistryLogoValidator,
} from '@projects/validator'
import {
	newProject,
	updateProject,
	projectDetailsById,
	projectApproval,
	getAllProjectService,
	docSignService,
	getDocService,
	getUserDraftProjectsService,
	createBankAccount,
	checkRequiredFields,
	getAllUserProjectService,
	getUserPublishedProjectsService,
	getAllProjectWalletService,
	createWithdrawRequestService,
	userDetailsById,
	withdrawDetailsById,
	approveWithdrawDetailsService,
	rejectWithdrawDetailsService,
	getAllWithdrawRequestService,
	getProjectForInvestmentService,
	updateProjectTransactionService,
	createTokenTransactionService,
	getProjectTransactionService,
	addSeedVccCreditsService,
	editYearlyProjectionService,
	getYearlyProjectionService,
	getMyportfolioService,
	transferAmountInCircleWalletService,
	createBlockchainBalanceService,
	getBlockchainBalanceService,
	updateGTPBlockchainBalanceService,
	updateProjectGTPService,
	mintVCCService,
	updateProjectService,
	createVccTokenTransactionService,
	updateVccTokenTransactionService,
	getVccSeedCreditService,
	updateVccSeedCreditService,
	merkleProofWhiteListingService,
	getProjectsService,
	getAllTranctonsService,
	getAllBalanceService,
	getTransactionService,
	getBalanceService,
	getInvestorTotalGTPAndVCCService,
	getUserInvestedProjectsVccService,
	getAllVccTranctonsService,
	addCountriesDataService,
	getCountriesDataService,
	getcountryDataService,
	documentsignService,
	getProjectService,
	getProjectDevDashboardGraphService,
	updateVCCBlockchainBalanceService,
	updateBlockchainBalance,
	getProjectDevProjectsService,
	getAllInvestedProjectsService,
	getInvestorDashboardGraphService,
	getstateDataService,
	getDistrictDataService,
	getRetiredCreditsService,
	getTotalRetiredCreditsService,
	getBlockchainBalanceByUserIdService,
	getInvestorDetailsService,
	getCreditRealisedService,
	getRetireHistoryService,
	createRoadmapForProjectService,
	updateRoadmapValidationStatusService,
	updateRoadmapValidationService,
	createRoadmapService,
	deleteRoadmapValidationService,
	getAvailableCreditsToRetireService,
	listProjectsToRetireGTPService,
	getAllRoadMapService,
	getRoadmapService,
	getProjectAllRoadMapService,
	getProjectDetailsService,
	getMyportfolioDataService,
	getDeveloperTotalGTPAndVCCService,
	getProjectsTokenIdService,
	returnFundsToInvestorService,
	updateProjectAfterWithdrawApproveService,
	deleteProjectDraftService,
	getProjectDevSummaryDashboardGraphService,
	updateYearlyProjectionService,
	getProjectDetailsForAdminService,
	getCircleWalletBalanceService,
	updateVvbRegistryLogoService,
	getProjectVccPublicDataService,
	getInvestmentsService,
	getPlatformAnalyticsService,
	changeProjectDisableStatusService,
	getPlatformStatsGraphService,
	getPlatformStatsMonthlyGraphService,
	sendNotificationToProjectInv,
	enableNotifyMeService,
	disableNotificationService,
	updateNotifyMeService,
	getUpcommingProjects,
	userPortfolioDataService,
	sendNotificationService,
	getSuperAdminService,
	getProjectPotBalanceService,
} from '@projects/service'

import { Logger } from '@config/logger'
import { errorHandler, responseHandler } from '@helpers/responseHandlers'
import messages from '@helpers/messages'
import { createSignUrl } from '@helpers/helloSign'
import WithdrawInterface from '@interfaces/withdraw'
import axios from 'axios'
import Config from '@config/config'
import {
	TokenTransactionInterface,
	VccTokenTransactionInterface,
	SeedVccCreditsInterface,
	ProjectsInterface,
} from '@interfaces/projects'
import moment from 'moment'
import { getUserByWalletAddress, getUserData } from '@dummy/user/service'
import { BlockchainBalanceInterface } from '@interfaces/projects'
import ProjectTransaction from '@projects/projectTransaction.model'
import { UserInterface } from '@interfaces/user'
import socketEvents from '@websockets/socket'
import { Op } from 'sequelize'
import {
	getMainPotBalance,
	transferBetweenAccounts,
	transferBetweenPots,
	getAllCurrencyPotBalance,
} from '@projects/caxtonService'
import { GetAllCurrencyPotBalance } from '@interfaces/caxton'

export const createProject = async (req: Request, res: Response) => {
	Logger.info('Inside create Project Controller')
	try {
		const { step, projectId } = req.body
		const { accountType } = req.user

		if (projectId) {
			const check = await projectDetailsById(projectId)
			if (check?.data?.is_submitted) {
				if (accountType === 'USER')
					return responseHandler({ res, msg: messages.PROJECT_ALREADY_SUBMITTED })
			} else if (!check?.data)
				return errorHandler({ res, statusCode: 406, err: messages.INVALID_PROJECT_ID })
		}

		if (step !== 6)
			return errorHandler({ res, statusCode: 406, err: messages.PROJECT_CREATED_FAILED })
		switch (step) {
			case 1: {
				const {
					title,
					country,
					state,
					city,
					address,
					postal_code,
					start_date,
					project_length,
					latitude,
					longitude,
					projectId,
				} = req.body
				const { id } = req.user
				const payload = {
					title,
					country,
					state,
					city,
					address,
					postal_code,
					vintage: start_date,
					latitude,
					longitude,
					length: project_length,
					userId: id,
					step,
				}

				const validator = await validateProject(step, payload)
				if (validator.error) {
					return errorHandler({ res, err: validator.message })
				}

				if (projectId) {
					const data = await updateProject(projectId, payload, step)
					if (data.error)
						return errorHandler({
							res,
							statusCode: 406,
							err: messages.PROJECT_CREATED_FAILED,
							data: data.error,
						})

					return responseHandler({ res, msg: `Step ${step} of project creation successful`, data })
				}

				const data = await newProject(payload)

				if (data.error)
					return errorHandler({
						res,
						statusCode: 406,
						err: messages.PROJECT_CREATED_FAILED,
						data: data.error,
					})

				return responseHandler({ res, msg: `Step ${step} of project creation successful`, data })
			}
			case 2: {
				const { standard, type, methodology, registry, project_activity, scale, projectId } =
					req.body
				const { id } = req.user
				const payload = {
					standard,
					registry,
					type,
					methodology,
					activity: project_activity,
					scale,
					userId: id,
					step,
				}

				const validator = await validateProject(step, payload)
				if (validator.error) {
					return errorHandler({ res, err: validator.message })
				}

				if (projectId) {
					const data = await updateProject(projectId, payload, step)
					if (data.error)
						return errorHandler({
							res,
							statusCode: 406,
							err: messages.PROJECT_CREATED_FAILED,
							data: data.error,
						})

					return responseHandler({ res, msg: `Step ${step} of project creation successful`, data })
				} else return errorHandler({ res, statusCode: 406, err: messages.INVALID_PROJECT_ID })
			}
			case 3: {
				const { project_report_doc, project_images, project_logo, other_docs, projectId } = req.body
				const { id } = req.user
				const payload = {
					project_details_doc: project_report_doc,
					project_images,
					project_logo,
					other_docs,
					userId: id,
					step,
				}

				const validator = await validateProject(step, payload)
				if (validator.error) {
					return errorHandler({ res, err: validator.message })
				}

				if (projectId) {
					const data = await updateProject(projectId, payload, step)

					if (data.error)
						return errorHandler({
							res,
							statusCode: 406,
							err: messages.PROJECT_CREATED_FAILED,
							data: { data },
						})

					return responseHandler({ res, msg: `Step ${step} of project creation successful`, data })
				} else return errorHandler({ res, statusCode: 406, err: messages.INVALID_PROJECT_ID })
			}
			case 4: {
				const {
					payment_method,
					account_type,
					account_number,
					routing_number,
					bank_country,
					bank_name,
					bank_city,
					bank_district,
					iban,
					plaid_token,
					billing_name,
					billing_country,
					billing_city,
					billing_address1,
					billing_address2,
					billing_postal_code,
					billing_district,
					projectId,
				} = req.body
				const { id } = req.user
				const payload = {
					payment_method,
					account_type,
					account_number,
					routing_number,
					bank_country,
					bank_name,
					bank_city,
					bank_district,
					iban,
					plaid_token,
					billing_name,
					billing_country,
					billing_city,
					billing_address1,
					billing_address2,
					billing_postal_code,
					billing_district,
					userId: id,
					step,
				}

				const validator = await validateProject(step, payload)
				if (validator.error) {
					return errorHandler({ res, err: validator.message })
				}

				if (projectId) {
					const data = await updateProject(projectId, payload, step)
					if (data.error)
						return errorHandler({
							res,
							statusCode: 406,
							err: messages.PROJECT_CREATED_FAILED,
							data: data.error,
						})

					return responseHandler({ res, msg: `Step ${step} of project creation successful`, data })
				} else return errorHandler({ res, statusCode: 406, err: messages.INVALID_PROJECT_ID })
			}
			case 5: {
				const { seed_credits, expected_credit_date, raise_amount, projectId, price_per_token } =
					req.body
				const { id } = req.user
				const payload = {
					seed_credits,
					expected_credit_date,
					raise_amount,
					price_per_token,
					userId: id,
					step,
				}

				const validator = await validateProject(step, payload)
				if (validator.error) {
					return errorHandler({ res, err: validator.message })
				}

				if (projectId) {
					const data = await updateProject(projectId, payload, step)
					if (data.error)
						return errorHandler({
							res,
							statusCode: 406,
							err: messages.PROJECT_CREATED_FAILED,
							data: data.error,
						})

					return responseHandler({ res, msg: `Step ${step} of project creation successful`, data })
				} else return errorHandler({ res, statusCode: 406, err: messages.INVALID_PROJECT_ID })
			}

			case 6: {
				const { projectId, payload } = req.body

				const { id } = req.user
				payload.userId = id

				// TODO: will remove this in future.
				if (!payload.project_type) {
					payload.project_type = 'Pipeline'
					if (!payload.project_sub_type) {
						payload.project_sub_type = 'Registration'
					}
				}
				const validator = await validateProject(step, payload)
				if (validator.error) {
					return errorHandler({ res, err: validator.message })
				}

				switch (payload.project_type) {
					case 'Planning': {
						switch (payload.project_sub_type) {
							case 'Project_Idea_Note': {
								break
							}
							case 'Project_Feasibility_Study': {
								break
							}
							case 'Project_Design_Document': {
								break
							}
							default: {
								break
							}
						}
						break
					}
					case 'Pipeline': {
						switch (payload.project_sub_type) {
							case 'Registration': {
								break
							}
							case 'Validation': {
								break
							}
							case 'Verification': {
								break
							}
							case 'Monitoring ': {
								break
							}
							default: {
								break
							}
						}
						break
					}
					case 'Realised': {
						switch (payload.project_sub_type) {
							case 'Monitoring+': {
								break
							}
							case 'Issuance_Rating': {
								break
							}
							case 'Project_Rating': {
								break
							}
							default: {
								break
							}
						}
						break
					}
				}

				if (projectId) {
					if (id !== payload.userId) return errorHandler({ res, err: messages.UNAUTHORIZE })
					const data = await updateProject(projectId, payload, step)
					if (data.error)
						return errorHandler({
							res,
							statusCode: 406,
							err: messages.PROJECT_CREATED_FAILED,
							data: data.error,
						})

					return responseHandler({ res, msg: `Step ${step} of project creation successful`, data })
				}
				if (Config.CIRCLE.CIRCLE_TEST_DATA) {
					payload.account_number = Config.CIRCLE.ACCOUNT_NUMBER!
					payload.routing_number = Config.CIRCLE.ROUTING_NUMBER!
					payload.billing_city = Config.CIRCLE.BILLING_CITY!
					payload.billing_country = Config.CIRCLE.BILLING_COUNTRY!
					payload.billing_district = Config.CIRCLE.BILLING_DISTRICT!
					payload.billing_line1 = Config.CIRCLE.BILLING_LINE1!
					payload.billing_postalCode = Config.CIRCLE.POSTAL_CODE!
					payload.bank_country = Config.CIRCLE.BANK_COUNTRY!
					payload.bank_district = Config.CIRCLE.BANK_DISTRICT!
				}
				const data = await newProject(payload)

				if (data.error)
					return errorHandler({
						res,
						statusCode: 406,
						err: messages.PROJECT_CREATED_FAILED,
						data: data.error,
					})

				return responseHandler({ res, msg: `Step ${step} of project creation successful`, data })
			}
		}
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const submitProject = async (req: Request, res: Response) => {
	Logger.info('Inside submit project controller')
	try {
		const { option } = req.body
		const { projectId } = req.params
		const { email, name } = req.user

		const validator = await validateProjectApproval(option, parseInt(projectId))

		if (validator.error) return errorHandler({ res, err: validator.message })

		const projectData = await projectDetailsById(parseInt(projectId))

		const check = await checkRequiredFields(projectData?.data?.toJSON())
		if (!check) return errorHandler({ res, statusCode: 206, err: messages.REQUIRED_FIELDS_MISSING })

		if (projectData?.data?.userId !== req.user.id)
			return errorHandler({ res, err: messages.UNAUTHORIZE })

		const {
			account_number,
			routing_number,
			iban, // Depends on account_type
			// description,	// REQUIRED
			title,
			billing_name,
			billing_city,
			billing_country,
			billing_address1,
			billing_address2,
			billing_district, //OPTIONAL
			billing_postal_code,
			bank_name,
			bank_city,
			bank_country,
			// bank_line1,	// Optional
			// bank_line2,	// Optional
			// bank_district,  // Optional
			userId,
			account_type,
		} = projectData?.data!

		const payload = {
			account_number,
			routing_number,
			IBAN: iban !== null ? iban.toString() : '',
			description: title,
			billing_name,
			billing_city,
			billing_country,
			billing_line1: billing_address1,
			billing_line2: billing_address2,
			billing_district,
			billing_postalCode: billing_postal_code.toString(),
			bank_name,
			bank_city,
			bank_country,
			// bank_line1,
			// bank_line2,
			// bank_district,
			userId,
			type_of_account: account_type,
		}

		const bankAccount: any = await createBankAccount(payload, req.headers.authorization!)

		if (bankAccount.data?.error!) return errorHandler({ res, data: bankAccount.data?.error! })

		const signData = await createSignUrl({ email, name: 'DJ' })
		if (!signData) return errorHandler({ res, err: messages.GET_DOC_FAILED })

		const { signatureId, url } = signData
		const result = await projectApproval(option, { projectId, signatureId, url })
		res.setHeader('signatureUrl', url)

		return responseHandler({ res, data: { result }, msg: messages.PROJECT_SUBMIT_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const getAllProject = async (req: Request, res: Response) => {
	Logger.info('Inside Get All Project Controller')
	try {
		const {
			offset,
			limit,
			search,
			orderBy,
			orderType,
			isVerify,
			registryName,
			registryType,
			startDate,
			strtDate,
			endDate,
			status,
			preVerification,
			fullVerification,
			seedStatus,
			userId,
		} = req.query
		const strOffset: string = offset ? offset.toString() : '0'
		const strLimit: string = limit ? limit.toString() : '10'
		const searchText: string = search !== undefined ? search?.toString()! : ''
		const strorderBy: string = orderBy !== undefined ? orderBy?.toString()! : 'createdAt'
		const strorderType: string = orderType !== undefined ? orderType?.toString()! : 'DESC'
		const registry: string = registryName !== undefined ? registryName?.toString()! : ''
		const type: string = registryType !== undefined ? registryType?.toString()! : ''
		const unApprovedProjectStatus: string = status !== undefined ? status?.toString()! : ''
		const isVarified: boolean = isVerify === 'true' ? true : false
		const seed_status: string = seedStatus !== undefined ? seedStatus?.toString()! : ''
		const pre_verification: string =
			preVerification !== undefined ? preVerification?.toString()! : ''
		const full_verification: string =
			fullVerification !== undefined ? fullVerification?.toString()! : ''
		const stDate: string = startDate !== undefined ? startDate?.toString() : ''
		const strDate: string = strtDate !== undefined ? strtDate?.toString() : ''
		const enDate: string = endDate ? endDate.toString() : new Date().toISOString().split('T')[0]
		const result = await getAllProjectService(
			isVarified,
			registry,
			type,
			parseInt(strOffset!),
			parseInt(strLimit!),
			searchText,
			strorderBy,
			strorderType,
			stDate,
			enDate,
			unApprovedProjectStatus,
			pre_verification,
			full_verification,
			seed_status,
			userId?.toString(),
			strDate
		)
		return responseHandler({ res, data: result, msg: messages.PROJECT_FETCHED_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const getProject = async (req: Request, res: Response) => {
	Logger.info('Inside Get Project Controller')
	try {
		const { projectId } = req.params
		const projectData = await getProjectDetailsService(
			parseInt(projectId),
			req.user.id,
			req.headers.authorization!
		)
		if (projectData === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_NOT_FOUND,
			})
		} else if (projectData === false) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.USER_NOT_FOUND,
			})
		}
		return responseHandler({ res, data: projectData, msg: messages.PROJECT_FETCHED_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const getProjectWithAllDetails = async (req: Request, res: Response) => {
	Logger.info('Inside Get Project For Admin Controller')
	try {
		const { projectId } = req.params
		const projectData = await getProjectDetailsForAdminService(parseInt(projectId), req.user.id)
		if (projectData === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_NOT_FOUND,
			})
		}
		return responseHandler({ res, data: projectData, msg: messages.PROJECT_FETCHED_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const unApproveProjectRejection = async (req: Request, res: Response) => {
	Logger.info('Inside Un Approved Project Rejection Controller')
	try {
		const { projectId, reason, editRequest } = req.body
		const payload = {
			projectId,
			reason,
			editRequest: editRequest ? true : false,
			rejectionType: 'unApproveProjectRejection',
		}
		const option = 'rejectProject'
		const projectData = await projectApproval(option, payload)
		if (projectData === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_NOT_FOUND_OR_REJECTED,
			})
		}
		const data = await getProjectService(
			{ id: projectId },
			{
				attributes: ['id', 'userId'],
			}
		)
		if (data === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_NOT_FOUND,
			})
		}
		if (editRequest) {
			await sendNotificationService(
				{
					title: 'Project edit requested',
					body: `Admin has requested you to edit the project. You can check the reason`,
					topic: `user-${data.userId}`,
					hasLink: true,
					link: 'my-projects',
					linkMsg: 'here',
				},
				data.userId,
				req.headers.authorization!
			)
		} else {
			await sendNotificationService(
				{
					title: 'Project rejected',
					body: `Attention! Your project is rejected by the platform admin.`,
					topic: `user-${data.userId}`,
				},
				data.userId,
				req.headers.authorization!
			)
		}
		return responseHandler({ res, msg: messages.PROJECT_REJECTED_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const preVerificationRejection = async (req: Request, res: Response) => {
	Logger.info('Inside Pre Verification Rejection Controller')
	try {
		const { projectId, reason } = req.body
		const payload = {
			projectId,
			reason,
			rejectionType: 'preVerificationRejection',
		}
		const option = 'rejectProject'
		const projectData = await projectApproval(option, payload)
		if (projectData === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_NOT_FOUND_OR_REJECTED,
			})
		}

		const data = await getProjectService(
			{ id: projectId },
			{
				attributes: ['id', 'userId', 'vvb_name', 'title'],
			}
		)
		if (data === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_NOT_FOUND,
			})
		}

		await sendNotificationService(
			{
				title: 'Pre-verification Rejected',
				body: `Attention! ${data.vvb_name} has rejected pre-verification for ${data.title}`,
				topic: `user-${data.userId}`,
			},
			data.userId,
			req.headers.authorization!
		)

		return responseHandler({ res, msg: messages.PROJECT_REJECTED_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const fullVerificationRejection = async (req: Request, res: Response) => {
	Logger.info('Inside Full Verification Rejection Controller')
	try {
		const { projectId, reason } = req.body
		const payload = {
			projectId,
			reason,
			rejectionType: 'fullVerificationRejection',
		}
		const option = 'rejectProject'
		const projectData = await projectApproval(option, payload)
		if (projectData === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_NOT_FOUND_OR_REJECTED,
			})
		}
		const data = await getProjectService(
			{ id: projectId },
			{
				attributes: ['id', 'userId', 'vvb_name', 'title'],
			}
		)
		if (data === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_NOT_FOUND,
			})
		}

		await sendNotificationService(
			{
				title: 'Full-verification Rejected',
				body: `Attention! ${data.vvb_name} has rejected full verification for ${data.title}.`,
				topic: `user-${data.userId}`,
			},
			data.userId,
			req.headers.authorization!
		)

		return responseHandler({ res, msg: messages.PROJECT_REJECTED_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const verifyProject = async (req: Request, res: Response) => {
	Logger.info('Inside Verify Project Controller')
	try {
		const { projectId, vvbId, vvbName, vvbInsight, vvbLogo } = req.body
		const payload = {
			projectId,
			vvbId,
			vvbName,
			vvbInsight,
			authorization: req.headers.authorization,
			vvbLogo,
		}
		const option = 'verifyProject'
		const projectData = await projectApproval(option, payload)
		if (projectData === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_NOT_FOUND_OR_REJECTED,
			})
		}
		const data = await getProjectService(
			{ id: projectId },
			{ attributes: ['id', 'userId', 'vvb_name', 'title'] }
		)
		if (data === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_NOT_FOUND,
			})
		}
		if (projectData === undefined) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.WALLET_CREATE_FAILED,
			})
		}
		const roadmapData = await createRoadmapForProjectService(projectId)
		if (!roadmapData) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.ROADMAP_CREATE_FAILED,
			})
		}
		await sendNotificationService(
			{
				title: 'Project verified',
				body: `Congratulation! Your project is successfully verified by the admin and presented to ${vvbName} for pre-verification process.`,
				topic: `user-${data.userId}`,
			},
			data.userId,
			req.headers.authorization!
		)

		return responseHandler({ res, msg: messages.PROJECT_VERIFIED_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const signDoc = async (req: Request, res: Response) => {
	Logger.info('Inside signDoc Controller')
	try {
		const user = req.user!

		const data = await docSignService({ email: user.email, name: user.name })

		return responseHandler({ res, data: { data } })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const getSignedDoc = async (req: Request, res: Response) => {
	Logger.info('Inside getSignedDoc Controller')
	try {
		const id = req.params.projectId

		const data = await getDocService(parseInt(id))
		if (!data) {
			return errorHandler({ res, err: messages.GET_DOC_FAILED })
		}
		res.setHeader('Content-Type', 'application/pdf')
		res.status(200).send(data)
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const updateProjectByAdmin = async (req: Request, res: Response) => {
	Logger.info('Inside Update Project By Admin Controller')
	try {
		const {
			projectId,
			short_description,
			exact_address,
			video,
			project_size,
			man_power,
			farm_type,
			approach,
			key_activities,
			sdg_commitments,
			impact_areas,
			area_offset_generation,
			min_annual_sequestration,
			max_annual_sequestration,
			per_year_annual_sequestration,
			total_credits_over_project,
			certification_date,
			additional_certification,
			registry_project_id,
			large_description,
			year_of_projection,
			projection,
			additional_note,
			additional_documents,
			totalNoOfInvestors,
			platform_fees,
			pre_verification_cost,
			vvb_fees,
			price_per_token,
		} = req.body

		const payload = {
			projectId,
			short_description,
			exact_address,
			video,
			project_size,
			man_power,
			farm_type,
			approach,
			key_activities,
			sdg_commitments,
			impact_areas,
			area_offset_generation,
			min_annual_sequestration,
			max_annual_sequestration,
			per_year_annual_sequestration,
			total_credits_over_project,
			certification_date,
			additional_certification,
			registry_project_id,
			large_description,
			year_of_projection,
			projection,
			additional_note,
			additional_documents,
			typeOfReview: 'saveAndExit',
			totalNoOfInvestors,
			platform_fees,
			pre_verification_cost,
			vvb_fees,
			price_per_token,
		}
		const validator = await updateProjectByAdminValidation(payload)
		if (validator.error) {
			return errorHandler({ res, err: validator.message })
		}
		const option = 'adminReviewComplete'
		const projectData = await projectApproval(option, payload)
		if (projectData === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_NOT_FOUND_OR_REJECTED,
			})
		}
		return responseHandler({ res, msg: messages.PROJECT_UPDATE_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const preVerificationApprovalController = async (req: Request, res: Response) => {
	Logger.info('Inside Pre Verification Approval Controller')
	try {
		let {
			projectId,
			short_description,
			exact_address,
			video,
			project_size,
			man_power,
			farm_type,
			approach,
			key_activities,
			sdg_commitments,
			impact_areas,
			area_offset_generation,
			min_annual_sequestration,
			max_annual_sequestration,
			per_year_annual_sequestration,
			total_credits_over_project,
			certification_date,
			additional_certification,
			registry_project_id,
			large_description,
			year_of_projection,
			projection,
			additional_note,
			additional_documents,
			platform_fees,
			pre_verification_cost,
			vvb_fees,
		} = req.body
		const payload = {
			projectId,
			short_description,
			exact_address,
			video,
			project_size,
			man_power,
			farm_type,
			approach,
			key_activities,
			sdg_commitments,
			impact_areas,
			area_offset_generation,
			min_annual_sequestration,
			max_annual_sequestration,
			per_year_annual_sequestration,
			total_credits_over_project,
			certification_date,
			additional_certification,
			registry_project_id,
			large_description,
			year_of_projection,
			projection,
			additional_note,
			additional_documents,
			typeOfReview: 'saveAndExit',
			platform_fees,
			pre_verification_cost,
			vvb_fees,
		}
		const validator = await preVerificationApprovalValidation(payload)
		if (validator.error) {
			return errorHandler({ res, err: validator.message })
		}
		const option = 'adminReviewComplete'
		const projectData = await projectApproval(option, payload)
		if (projectData === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_NOT_FOUND_OR_REJECTED,
			})
		}
		return responseHandler({ res, msg: messages.PRE_VERIFICATION_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const preVerificationSuccessController = async (req: Request, res: Response) => {
	Logger.info('Inside Pre Verification Success Controller')
	try {
		let {
			projectId,
			preVerificationDoc,
			live_seed_project,
			hold_for_full_verification,
			project_seed_start_date,
			project_seed_end_date,
		} = req.body
		project_seed_start_date = project_seed_start_date ? new Date(project_seed_start_date) : null
		project_seed_end_date = project_seed_end_date ? new Date(project_seed_end_date) : null
		const payload = {
			projectId,
			preVerificationDoc,
			live_seed_project,
			hold_for_full_verification,
			project_seed_start_date,
			project_seed_end_date,
			typeOfReview: 'preVerificationSuccess',
			authorization: req.headers.authorization,
		}
		const validator = await preVerificationSuccessValidation({
			projectId,
			preVerificationDoc,
			live_seed_project,
			hold_for_full_verification,
		})
		if (validator.error) {
			return errorHandler({ res, err: validator.message })
		}
		if (live_seed_project) {
			const validator = await liveSeedProjectValidation({
				projectId,
				live_seed_project,
				hold_for_full_verification,
				project_seed_start_date,
				project_seed_end_date,
			})
			if (validator.error) {
				return errorHandler({ res, err: validator.message })
			}
		}
		const option = 'adminReviewComplete'
		const projectData: any = await projectApproval(option, payload)
		if (projectData === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_NOT_FOUND_OR_REJECTED,
			})
		}
		if (projectData === false) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_NOT_APPROVED,
			})
		}
		if (projectData === undefined) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.INSUFFICIENT_FUND,
			})
		}
		if (projectData === 'AlreadyMinted') {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.GTP_TOKEN_NOT_Sold,
			})
		}
		const data = await getProjectService(
			{ id: projectId },
			{
				attributes: ['id', 'userId', 'vvb_name', 'title'],
			}
		)
		if (data === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_NOT_FOUND,
			})
		}
		if (data.hold_for_full_verification) {
			await sendNotificationService(
				{
					title: 'Pre-verification Success',
					body: `Congratulation! You are one step closer to your funding. ${data.vvb_name} has approved the project ${data.title} pre-verification.`,
					topic: `user-${data.userId}`,
				},
				data.userId,
				req.headers.authorization!
			)
		} else {
			await sendNotificationService(
				{
					title: 'Pre-verification Success',
					body: `Congratulation! You are one step closer to your funding. ${data.vvb_name} has approved the project ${data.title} pre-verification & project will go live on `,
					topic: `user-${data.userId}`,
					liveDate: project_seed_start_date,
				},
				data.userId,
				req.headers.authorization!
			)

			setTimeout(async () => {
				await sendNotificationToProjectInv(
					data.id,
					'New project will active',
					`New Project ${data.title} will be active in next 1 hours.`,
					false,
					false,
					`view-project/${data.id}`,
					'now',
					false,
					req.headers.authorization!
				)
			}, project_seed_start_date.getTime() - 3600000)
		}

		if (projectData.data) {
			return responseHandler({
				res,
				data: projectData.data,
				msg: messages.PRE_VERIFICATION_SUCCESS,
			})
		}
		return responseHandler({ res, msg: messages.PRE_VERIFICATION_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const getAllUserProjects = async (req: Request, res: Response) => {
	Logger.info('inside get all user project controller')
	try {
		const { offset, limit, orderBy, orderType, projectStatus, vvbStatus, startDate, endDate } =
			req.query

		const strOffset: string = offset ? offset.toString() : '0'
		const strLimit: string = limit ? limit.toString() : '10'
		const strorderBy: string = orderBy !== undefined ? orderBy?.toString()! : 'createdAt'
		const strorderType: string = orderType !== undefined ? orderType?.toString()! : 'DESC'
		const project_status: string = projectStatus !== undefined ? projectStatus?.toString()! : ''
		const vvb_status: string = vvbStatus !== undefined ? vvbStatus?.toString()! : ''
		const stDate: string = startDate !== undefined ? startDate?.toString() : ''
		const enDate: string = endDate ? endDate.toString() : new Date().toISOString().split('T')[0]
		const { id } = req.user

		const result = await getAllUserProjectService(
			parseInt(strOffset),
			parseInt(strLimit),
			strorderBy,
			strorderType,
			stDate,
			enDate,
			project_status,
			vvb_status,
			id
		)

		return responseHandler({ res, data: result, msg: messages.PROJECT_FETCHED_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const getUserDraftProjects = async (req: Request, res: Response) => {
	Logger.info('Inside Get User Draft Projects Controller')
	try {
		const { offset, limit, orderBy, orderType } = req.query

		const strOffset: string = offset ? offset.toString() : '0'
		const strLimit: string = limit ? limit.toString() : '10'
		const strorderBy: string = orderBy !== undefined ? orderBy?.toString()! : 'createdAt'
		const strorderType: string = orderType !== undefined ? orderType?.toString()! : 'DESC'
		const { id } = req.user

		const projectData = await getUserDraftProjectsService(
			parseInt(strOffset),
			parseInt(strLimit),
			strorderBy,
			strorderType,
			id
		)
		if (projectData === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_NOT_FOUND,
			})
		}
		return responseHandler({ res, data: projectData, msg: messages.PROJECT_FETCHED_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const fullVerificationSuccessController = async (req: Request, res: Response) => {
	Logger.info('Inside Full Verification Success Controller')
	try {
		let {
			projectId,
			fullVerificationDoc,
			live_seed_project,
			project_seed_start_date,
			project_seed_end_date,
		} = req.body
		project_seed_start_date = project_seed_start_date ? new Date(project_seed_start_date) : null
		project_seed_end_date = project_seed_end_date ? new Date(project_seed_end_date) : null
		const payload = {
			projectId,
			fullVerificationDoc,
			live_seed_project,
			project_seed_start_date,
			project_seed_end_date,
			typeOfReview: 'fullVerificationSuccess',
			authorization: req.headers.authorization,
		}
		const validator = await fullVerificationSuccessValidation({
			projectId,
			fullVerificationDoc,
			live_seed_project,
		})
		if (validator.error) {
			return errorHandler({ res, err: validator.message })
		}
		if (live_seed_project) {
			const validator = await liveSeedProjectValidation({
				projectId,
				live_seed_project,
				hold_for_full_verification: false,
				project_seed_start_date,
				project_seed_end_date,
			})
			if (validator.error) {
				return errorHandler({ res, err: validator.message })
			}
		}
		const option = 'adminReviewComplete'
		const projectData: any = await projectApproval(option, payload)
		if (projectData === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_NOT_FOUND_OR_REJECTED,
			})
		}
		if (projectData === false) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PRE_VERIFICATION_PENDING,
			})
		}
		if (projectData === undefined) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.INSUFFICIENT_FUND,
			})
		}
		if (projectData === 'AlreadyMinted') {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.GTP_TOKEN_NOT_Sold,
			})
		}
		const data = await getProjectService(
			{ id: projectId },
			{
				attributes: ['id', 'userId', 'vvb_name', 'title'],
			}
		)
		if (data === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_NOT_FOUND,
			})
		}
		if (!data.live_seed_project) {
			await sendNotificationService(
				{
					title: 'Full-verification Success',
					body: `Congratulation! You are one step closer to your funding. ${data.vvb_name} has approved the project ${data.title} full-verification.`,
					topic: `user-${data.userId}`,
				},
				data.userId,
				req.headers.authorization!
			)
		} else {
			await sendNotificationService(
				{
					title: 'Full-verification Success',
					body: `Congratulation! You are one step closer to your funding. ${data.vvb_name} has approved the project ${data.title} full verification & project will go live on `,
					topic: `user-${data.userId}`,
					liveDate: project_seed_start_date,
				},
				data.userId,
				req.headers.authorization!
			)

			setTimeout(async () => {
				await sendNotificationToProjectInv(
					data.id,
					'New project will active',
					`New Project ${data.title} will be active in next 1 hours.`,
					false,
					false,
					`view-project/${data.id}`,
					'now',
					false,
					req.headers.authorization!
				)
			}, project_seed_start_date.getTime() - 3600000)
		}

		if (projectData.data) {
			return responseHandler({
				res,
				data: projectData.data,
				msg: messages.PRE_VERIFICATION_SUCCESS,
			})
		}
		return responseHandler({ res, msg: messages.FULL_VERIFICATION_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const liveSeedProjectController = async (req: Request, res: Response) => {
	Logger.info('Inside Live Seed Project Controller')
	try {
		let { projectId, live_seed_project, project_seed_start_date, project_seed_end_date } = req.body
		project_seed_start_date = project_seed_start_date ? new Date(project_seed_start_date) : null
		project_seed_end_date = project_seed_end_date ? new Date(project_seed_end_date) : null
		const payload = {
			projectId,
			live_seed_project,
			project_seed_start_date,
			project_seed_end_date,
			typeOfReview: 'liveSeedProject',
			authorization: req.headers.authorization,
		}
		if (live_seed_project) {
			const validator = await liveSeedProjectValidation({
				projectId,
				live_seed_project,
				hold_for_full_verification: false,
				project_seed_start_date,
				project_seed_end_date,
			})
			if (validator.error) {
				return errorHandler({ res, err: validator.message })
			}
		}
		const option = 'adminReviewComplete'
		const projectData: any = await projectApproval(option, payload)
		if (projectData === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_NOT_FOUND_OR_REJECTED,
			})
		}
		if (projectData === undefined) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.INSUFFICIENT_FUND,
			})
		}
		if (projectData === 'AlreadyMinted') {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.GTP_TOKEN_NOT_Sold,
			})
		}
		const data = await getProjectService(
			{ id: projectId },
			{
				attributes: ['id', 'userId', 'vvb_name', 'title'],
			}
		)
		if (data === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_NOT_FOUND,
			})
		}

		if (projectData.data) {
			if (data.live_seed_project) {
				await sendNotificationService(
					{
						title: 'Project will live',
						body: `Congratulation! Your project ${data.title} will go live on`,
						topic: `user-${data.userId}`,
						liveDate: project_seed_start_date,
					},
					data.userId,
					req.headers.authorization!
				)

				setTimeout(async () => {
					await sendNotificationToProjectInv(
						data.id,
						'New project will active',
						`New Project ${data.title} will be active in next 1 hours.`,
						false,
						false,
						`view-project/${data.id}`,
						'now',
						false,
						req.headers.authorization!
					)
				}, project_seed_start_date.getTime() - 3600000)
			}
			return responseHandler({
				res,
				data: projectData.data,
				msg: messages.PRE_VERIFICATION_SUCCESS,
			})
		}
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const getUserPublishedProjects = async (req: Request, res: Response) => {
	Logger.info('Inside getUserPublishedProjects controller')
	try {
		const { id } = req.user

		const projectData = await getUserPublishedProjectsService(id)
		if (projectData === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_NOT_FOUND,
			})
		}
		return responseHandler({ res, data: projectData, msg: messages.PROJECT_FETCHED_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const getProjectWallet = async (req: Request, res: Response) => {
	Logger.info('Inside Get Project Wallet controller')
	try {
		const {
			offset,
			limit,
			search,
			country,
			startDate,
			endDate,
			projectStatus,
			strtdate,
			orderBy,
			orderType,
		} = req.query

		const strOffset: string = offset ? offset.toString() : '0'
		const strLimit: string = limit ? limit.toString() : '10'
		const searchText: string = search !== undefined ? search?.toString()! : ''
		const seed_status: string = projectStatus !== undefined ? projectStatus?.toString()! : ''
		const countryData: string = country !== undefined ? country?.toString()! : ''
		const stDate: string = startDate !== undefined ? startDate?.toString() : ''
		const enDate: string = endDate ? endDate.toString() : new Date().toISOString().split('T')[0]
		const strStartDate: string = strtdate !== undefined ? strtdate?.toString() : ''
		const strorderBy: string = orderBy !== undefined ? orderBy?.toString()! : 'createdAt'
		const strorderType: string = orderType !== undefined ? orderType?.toString()! : 'DESC'
		const listProjectWallet = await getAllProjectWalletService(
			parseInt(strOffset!),
			parseInt(strLimit!),
			searchText,
			seed_status,
			countryData,
			stDate,
			enDate,
			req.headers.authorization!,
			strStartDate,
			strorderBy,
			strorderType
		)
		return responseHandler({
			res,
			data: { ...listProjectWallet },
			msg: messages.PROJECT_FETCHED_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const createWithdrawRequest = async (req: Request, res: Response) => {
	Logger.info('Inside Create Withdraw Request controller')
	try {
		const { amount, withdrawDocs, withdrawReason, projectId } = req.body
		const userId = req.user.id
		const validator = await createWithdrawRequestValidation({
			amount,
			withdrawDocs,
			withdrawReason,
			projectId,
			userId,
		})
		if (validator.error) {
			return errorHandler({ res, err: validator.message })
		}
		const userData: any = await userDetailsById(userId)
		if (userData === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.USER_NOT_FOUND,
			})
		}
		const projectData: any = await projectDetailsById(projectId)
		if (projectData === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_NOT_FOUND,
			})
		}
		if (!projectData?.data.canWithdraw)
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.WITHDRAW_FAILED_SEED_LIVE,
			})
		if (withdrawDocs.length === 0) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.WITHDRAW_DOCUMENT_NOT_FOUND,
			})
		}
		const totalWithdraw = projectData.data.withdraw_amount + amount
		if (totalWithdraw > projectData.data.raise_amount) {
			return errorHandler({
				res,
				statusCode: 406,
				err: `${messages.REQUEST_AMOUNT_EXCEED}`,
			})
		}

		const payload: WithdrawInterface = {
			id: uuid(),
			requestAmount: amount,
			withdrawDocuments: withdrawDocs,
			withdrawReason,
			requestStatus: 'PENDING',
			projectId,
			projectWalletId: projectData.data.walletId,
			userId,
			userWalletId: userData.data.walletId,
			dateOfRequest: new Date(Date.now()),
		}
		const withdrawData = await createWithdrawRequestService(payload)
		if (withdrawData === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.CREATE_WITHDRAW_FAILED,
			})
		}

		await sendNotificationService(
			{
				title: 'Withdraw request sent',
				body: `Invoices are successfully submitted to the platform admin. If approved the amount will be transferred to your EnverX wallet.`,
				topic: `user-${req.user.userId}`,
			},
			req.user.userId,
			req.headers.authorization!
		)

		return responseHandler({
			res,
			msg: messages.CREATE_WITHDRAW_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}
export const getAllWithdrawRequest = async (req: Request, res: Response) => {
	Logger.info('Inside Get All Withdraw Request controller')
	try {
		const { withdrawStatus, projectId } = req.params
		const status = withdrawStatus.toString().toUpperCase()
		const withdrawList = await getAllWithdrawRequestService(status, parseInt(projectId))
		return responseHandler({
			res,
			data: withdrawList,
			msg: messages.PROJECT_FETCHED_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const approveWithdrawRequest = async (req: Request, res: Response) => {
	Logger.info('Inside Approve Withdraw Request controller')
	try {
		const { withdrawId } = req.params
		const withdrawData: any = await withdrawDetailsById(withdrawId)
		if (withdrawData === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.WITHDRAW_FETCH_FAILED,
			})
		}

		// Implement caxton
		if (Config.PAYMENT.CAXTON.CAXTON_ENABLE) {
			const user = await getUserData({
				id: withdrawData.data.userId,
			})

			if (!user)
				return errorHandler({
					res,
					statusCode: 400,
					err: messages.USER_NOT_FOUND,
				})

			const {
				email: userEmail,
				caxtonPassword: userCaxtonPassword,
				caxtonUserId: userCaxtonId,
			} = user

			const authToken = req.headers.authorization!

			const superAdmin = await getSuperAdminService(authToken)
			if (!superAdmin)
				return errorHandler({
					res,
					statusCode: 500,
					err: messages.ADMIN_FETCH_FAILED,
				})

			const { email: adminEmail, caxtonPassword: adminCaxtonPassword } = superAdmin

			const project = await getProjectService(
				{
					id: withdrawData.data.projectId,
				},
				{
					attributes: ['CcyCode', 'BaseCcyCode'],
				}
			)

			if (!project)
				return errorHandler({
					res,
					statusCode: 400,
					err: messages.PROJECT_NOT_FOUND,
				})

			const { CcyCode: projectCurrencyPot, BaseCcyCode: projectCurrency } = project

			// @note Caxton: Transfer funds from super admin project specific pot to project developer project specific pot
			const accTransferRes = await transferBetweenAccounts(
				{
					userEmail: adminEmail!,
					password: adminCaxtonPassword!,
					userAPIToken: '',
					userTokenExpire: '',
					caxtonUserId: userCaxtonId,
					sendCurrency: projectCurrencyPot,
					amount: withdrawData.data.requestAmount,
					deviceId: '',
					device: '',
					operatingSystem: '',
					projectId: project.id,
					projectTitle: project.title,
				},
				authToken
			)

			if (!accTransferRes.status)
				return errorHandler({
					res,
					statusCode: accTransferRes.errorStatus,
					err: accTransferRes.errorMessage,
				})

			// @note Caxton: Transfer funds from project developer project specific pot to project developer main pot
			const potTransferRes = await transferBetweenPots(
				{
					userEmail: userEmail,
					password: userCaxtonPassword,
					userAPIToken: '',
					userTokenExpire: '',
					fromCurrencyPot: projectCurrencyPot,
					toCurrencyPot: projectCurrency,
					amount: withdrawData.data.requestAmount,
					deviceId: '',
					device: '',
					operatingSystem: '',
					projectId: project.id,
					projectTitle: project.title,
				},
				authToken
			)

			if (!potTransferRes.status)
				return errorHandler({
					res,
					statusCode: potTransferRes.errorStatus,
					err: potTransferRes.errorMessage,
				})
		} else {
			const transferObj = {
				sourceWalletId: withdrawData.data.projectWalletId,
				sourceType: 'wallet',
				destinationWalletId: withdrawData.data.userWalletId,
				destinationType: 'wallet',
				amount: withdrawData.data.requestAmount.toString(),
				currency: 'USD',
				userId: withdrawData.data.userId,
			}
			let circleError: boolean = false
			let errMessage: string = ''
			const circleResponse = (await axios
				.post(`${Config.PAYMENT.CREATE_TRANSFER}`, transferObj, {
					headers: {
						authorization: req.headers.authorization!,
					},
				})
				.catch((err) => {
					Logger.error(err)
					circleError = true
					errMessage = err.response.data.msg
				}))!
			if (circleError) {
				return errorHandler({
					res,
					statusCode: 500,
					err: errMessage,
				})
			}
		}

		const result = await approveWithdrawDetailsService(
			withdrawData.data.id,
			withdrawData.data.requestAmount
		)
		if (!result) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.WITHDRAW_APPROVE_FAILED,
			})
		}
		const projectData = await updateProjectAfterWithdrawApproveService(
			parseInt(withdrawData.data.projectId),
			parseFloat(withdrawData.data.requestAmount)
		)
		if (!projectData) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.WITHDRAW_APPROVE_FAILED,
			})
		}

		await sendNotificationService(
			{
				title: 'Withdraw request approved',
				body: `Congratulation! Your withdrawal request is approved successfully & ${withdrawData.data.requestAmount.toString()} has been added to your EnverX wallet.`,
				topic: `user-${withdrawData.data.userId}`,
			},
			withdrawData.data.userId,
			req.headers.authorization!
		)

		return responseHandler({
			res,
			msg: messages.WITHDRAW_REQUEST_APPROVED,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const rejectWithdrawRequest = async (req: Request, res: Response) => {
	Logger.info('Inside reject Withdraw Request controller')
	try {
		const { withdrawId, rejectReason, rejectTitle } = req.body
		const withdrawData: any = await withdrawDetailsById(withdrawId)
		if (withdrawData === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.WITHDRAW_REJECT_FAILED,
			})
		}
		const result = await rejectWithdrawDetailsService(withdrawId, rejectReason, rejectTitle)
		if (!result) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.WITHDRAW_REJECT_FAILED,
			})
		}

		await sendNotificationService(
			{
				title: 'Withdraw request rejected',
				body: `Attention! Your withdrawal request of ${withdrawData.data.requestAmount.toString()} is rejected by the platform admin.`,
				topic: `user-${withdrawData.data.userId}`,
			},
			withdrawData.data.userId,
			req.headers.authorization!
		)

		return responseHandler({
			res,
			msg: messages.WITHDRAW_REQUEST_REJECTED,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}
export const getProjectForInvestment = async (req: Request, res: Response) => {
	Logger.info('Inside Get Project For Investment controller')
	try {
		const { status, countryData, registry, startDate, endDate, length, projectType } = req.query
		const countryArray: string[] =
			countryData !== undefined ? countryData?.toString().split(',') : []
		const projectStatus: string = status !== undefined ? status?.toString()! : 'ACTIVE'
		const project_type: string = projectType !== undefined ? projectType?.toString()! : ''
		const registryName: string = registry !== undefined ? registry?.toString()! : ''
		const strLength: string = length !== undefined ? length?.toString()! : '0'
		const stDate: string = startDate !== undefined ? startDate?.toString() : ''
		const enDate: string = endDate ? endDate.toString() : new Date().toISOString().split('T')[0]
		const listProject = await getProjectForInvestmentService(
			projectStatus,
			countryArray,
			project_type,
			stDate,
			enDate,
			registryName,
			strLength,
			req.user.id
		)
		return responseHandler({
			res,
			data: listProject,
			msg: messages.PROJECT_FETCHED_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const updateProjectTransaction = async (req: Request, res: Response) => {
	Logger.info('Inside Update Project Transaction controller')
	try {
		const { txHash, tokenId } = req.body
		const trasactionData = await updateProjectTransactionService(txHash, tokenId)
		if (!trasactionData) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_TRANSACTION_UPDATE_FAILED,
			})
		}
		return responseHandler({
			res,
			msg: messages.PROJECT_TRANSACTION_UPDATE_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const createTokenTransaction = async (req: Request, res: Response) => {
	Logger.info('Inside Create Project Transaction controller')
	try {
		const { txHash, tokenId, from, to, amount } = req.body
		const projectTransactionData: any = await getProjectTransactionService({ tokenId })
		if (!projectTransactionData) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_TRANSACTION_NOT_FOUND,
			})
		}
		const userData: any = await getUserByWalletAddress(to)
		const payload: TokenTransactionInterface = {
			id: uuid(),
			transactionHash: txHash,
			tokenId,
			projectId: projectTransactionData.projectId,
			tokenQuantity: parseInt(amount),
			fromWalletAddress: from,
			toWalletAddress: to,
			eventType: 'Transfer',
			userId: userData.id,
		}
		const tokenTransactionData = await createTokenTransactionService(payload)
		if (!tokenTransactionData) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.TOKEN_TRANSACTION_CREATE_FAILED,
			})
		}
		const balanceData: any = await getBlockchainBalanceService(
			projectTransactionData.projectId,
			tokenId,
			userData.id
		)
		const projectData: any = await projectDetailsById(projectTransactionData.projectId)
		let noOfGTPAvailable: number
		let noOfGTPSold: number
		if (!balanceData) {
			const blockObj: BlockchainBalanceInterface = {
				id: uuid(),
				tokenId,
				projectId: projectTransactionData.projectId,
				projectName: projectData.data.title,
				userId: userData.id,
				userName: userData.companyName,
				noOfGTPToken: parseInt(amount),
			}
			const blockchainBalance = await createBlockchainBalanceService(blockObj)
			if (!blockchainBalance) {
				return errorHandler({
					res,
					statusCode: 406,
					err: messages.CREATE_BLOCKCHAIN_BALANCE_FAILED,
				})
			}
		} else {
			const noOfGTPToken = balanceData.noOfGTPToken + parseInt(amount)
			await updateGTPBlockchainBalanceService(
				projectTransactionData.projectId,
				tokenId,
				userData.id,
				noOfGTPToken
			)
		}
		if (from !== '0x0000000000000000000000000000000000000000') {
			const userObj: any = await getUserByWalletAddress(from)
			const balance: any = await getBlockchainBalanceService(
				projectTransactionData.projectId,
				tokenId,
				userObj.id
			)
			const noOfGTPToken = balance.noOfGTPToken - parseInt(amount)
			await updateGTPBlockchainBalanceService(
				projectTransactionData.projectId,
				tokenId,
				userObj.id,
				noOfGTPToken
			)
			noOfGTPAvailable = projectData.data.noOfGTPAvailable - parseInt(amount)
			noOfGTPSold = projectData.data.noOfGTPSold + parseInt(amount)
		} else {
			noOfGTPAvailable = parseInt(amount)
			noOfGTPSold = 0
		}

		const updatedProject = await updateProjectGTPService(
			noOfGTPAvailable,
			noOfGTPSold,
			projectData.data.id
		)

		responseHandler({
			res,
			data: tokenTransactionData,
			msg: messages.TOKEN_TRANSACTION_CREATE_SUCCESS,
		})
		let escrowBalance
		if (Config.PAYMENT.CAXTON.CAXTON_ENABLE) {
			let caxtonResponse = await getProjectPotBalanceService(
				projectData.data.potPrefix,
				projectData.data.BaseCcyCode,
				req.headers.authorization!
			)
			escrowBalance = caxtonResponse
		} else {
			escrowBalance = await getCircleWalletBalanceService(
				projectData.data.walletId,
				req.headers.authorization!
			)
		}

		const socketData = {
			seed_credits: updatedProject?.seed_credits,
			noOfGTPAvailable: updatedProject?.noOfGTPAvailable,
			id: updatedProject?.id,
			escrowBalance,
			raise_amount: updatedProject?.raise_amount,
			price_per_token: updatedProject?.price_per_token,
			currentNoOfInvestors: updatedProject?.currentNoOfInvestors,
			noOfGTPSold: updatedProject?.noOfGTPSold,
		}
		const eventSeedMarketplace = socketEvents.io.volatile.emit('seedMarketplace', socketData)
		Logger.info(`eventSeedMarketplace ${eventSeedMarketplace}`)
		const eventProject = socketEvents.io.volatile.emit('project', socketData)
		Logger.info(`eventProject ${eventProject}`)
		return
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const addSeedVccCredits = async (req: Request, res: Response) => {
	Logger.info('Inside addSeedVccCredits controller')
	try {
		const validator = await addSeedVccCreditsValidation(req.body)
		if (validator.error) {
			return errorHandler({ res, err: validator.message })
		}

		const { projectId, serialNumber, quantityIssued, additionalCertificates } = req.body
		const authorization = `${req.headers.authorization}`

		const superAdminResponse: any = await axios
			.get(`${Config.ADMIN.GET_SUPER_ADMIN}`, {
				headers: {
					authorization,
				},
			})
			.catch((err) => {
				Logger.error(err)
			})

		if (!superAdminResponse?.data)
			return errorHandler({
				res,
				statusCode: 400,
				err: messages.ADMIN_FETCH_FAILED,
			})

		const superAdmin: any = superAdminResponse.data.data

		const projectTransaction = await getProjectTransactionService({ projectId })

		if (!projectTransaction)
			return errorHandler({
				res,
				statusCode: 400,
				err: messages.TOKEN_ID_NOT_FOUND,
			})

		const projectData = await projectDetailsById(parseInt(projectId))
		if (projectData === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_NOT_FOUND,
			})
		}
		if (projectData?.data?.full_verification_status !== 'approved') {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_IS_NOT_FULL_VERIFIED,
			})
		}
		if (projectData?.data?.seed_status !== 'completed') {
			if (projectData?.data?.seed_status !== 'realised') {
				return errorHandler({
					res,
					statusCode: 406,
					err: messages.PROJECT_SEED_LIVE_IS_PENDING,
				})
			}
		}

		let tokenId: string = ''
		if (projectTransaction instanceof ProjectTransaction) tokenId = projectTransaction?.tokenId
		const uri = `${Config.PUBLIC.GET_PUBLIC_VCC_DATA}/${projectId}/${tokenId}`
		const mintVccResponse = await mintVCCService(
			superAdmin,
			projectId,
			tokenId,
			quantityIssued,
			uri,
			authorization
		)
		if (!mintVccResponse)
			return errorHandler({
				res,
				statusCode: 404,
				err: messages.INSUFFICIENT_FUND,
			})

		const seedVccCredit: any = await addSeedVccCreditsService({
			id: uuid(),
			projectId,
			projectTokenId: tokenId,
			serialNumber,
			additionalCertificates,
			transactionHash: mintVccResponse.data.data.result.transactionHash,
			userWallet: superAdmin.blockchainWalletAddress,
		})
		if (seedVccCredit) {
			await updateYearlyProjectionService(parseInt(projectId), new Date(), {
				realised: parseInt(quantityIssued),
			})
			return responseHandler({
				res,
				data: seedVccCredit,
				msg: messages.ADD_SEED_CREDIT_SUCCESS,
			})
		}

		return errorHandler({
			res,
			statusCode: 500,
			err: messages.ADD_SEED_CREDIT_FAILED,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const updateSeedVCCCredits = async (req: Request, res: Response) => {
	Logger.info('Inside Update Seed VCC Credits function')
	try {
		const { txHash, tokenQuantity, tokenId, projectId, uri } = req.body
		const checkVccSeedCredit = await getVccSeedCreditService({ transactionHash: txHash })
		if (!checkVccSeedCredit) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.VCC_SEED_CREDIT_NOT_FOUND,
			})
		}
		const project: any = await projectDetailsById(projectId)
		if (!project?.data)
			return errorHandler({
				res,
				statusCode: 404,
				err: messages.PROJECT_NOT_FOUND,
			})
		const seedVccCredit = await updateVccSeedCreditService(
			{ quantityIssued: tokenQuantity },
			{ transactionHash: txHash }
		)
		const totalIssuedCredit = project.data.vcc_issued + parseInt(tokenQuantity)
		const totalVccCredit = project.data.total_vcc_issued + parseInt(tokenQuantity)
		if (totalVccCredit === project.data.seed_credits) {
			await updateProjectService(
				{
					vcc_issued: totalIssuedCredit,
					total_vcc_issued: totalVccCredit,
					seed_status: 'realised',
					project_status: 'Completed',
				},
				{ id: projectId }
			)
		} else {
			await updateProjectService(
				{
					vcc_issued: totalIssuedCredit,
					total_vcc_issued: totalVccCredit,
					seed_status: 'realised',
					project_status: 'Credit Realised',
				},
				{ id: projectId }
			)
		}
		if (project.data.vcc_issued === 0) {
			await sendNotificationToProjectInv(
				project.id,
				'Credit Realization',
				`Credits realization started. Retire your VCC`,
				true,
				true,
				`view-project/${project.id}`,
				'now',
				true,
				req.headers.authorization!
			)
		}

		if (seedVccCredit) {
			await updateYearlyProjectionService(parseInt(projectId), new Date(), {
				vcc_issued: parseInt(tokenQuantity),
			})
			return responseHandler({
				res,
				msg: messages.SEED_CREDIT_UPDATE_SUCCESS,
			})
		}
		return errorHandler({
			res,
			statusCode: 500,
			err: messages.SEED_CREDIT_UPDATE_FAILED,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const getYearlyProjectProjectionController = async (req: Request, res: Response) => {
	Logger.info('Inside getYearlyProjectProjectionController function')
	try {
		const { projectId } = req.params
		const { offset, limit, search, orderBy, orderType } = req.query

		const strOffset: string = offset ? offset.toString() : '0'
		const strLimit: string = limit ? limit.toString() : '10'
		const strorderBy: string = orderBy !== undefined ? orderBy?.toString()! : 'createdAt'
		const strorderType: string = orderType !== undefined ? orderType?.toString()! : 'DESC'
		const searchText: string = search !== undefined ? search?.toString()! : ''

		const result = await getYearlyProjectionService(
			parseInt(projectId),
			parseInt(strOffset),
			parseInt(strLimit),
			strorderBy,
			strorderType
		)
		if (!result) {
			return errorHandler({
				res,
				statusCode: 406,
				err: `${messages.INVALID_PROJECT_ID} ${projectId}`,
			})
		}
		return responseHandler({
			res,
			data: result!,
			msg: `${messages.YEARLY_PROJECTION_ADDED} ${projectId}`,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const editYearlyProjectProjectionController = async (req: Request, res: Response) => {
	Logger.info('Inside editYearlyProjectProjectionController function')
	try {
		const { projectId } = req.params
		const { projected_credits, year } = req.body
		const { accountType } = req.user

		const payload: {
			projected_credits: number
			year: any
			projectId: number
			fullYear: number
		} = {
			projected_credits: parseInt(projected_credits),
			year: moment(year).toISOString(),
			projectId: parseInt(projectId),
			fullYear: new Date(year).getFullYear(),
		}
		const result = await editYearlyProjectionService(payload)
		if (!result) {
			return errorHandler({
				res,
				statusCode: 406,
				err: `${messages.YEARLY_PROJECTION_FAILED} ${projectId}`,
			})
		}
		if (result.error) {
			return errorHandler({
				res,
				statusCode: 406,
				data: result?.error!,
			})
		}
		return responseHandler({
			res,
			data: { result },
			msg: `${messages.YEARLY_PROJECTION_EDITED} ${projectId}`,
		})
	} catch (error) {
		errorHandler({ res, data: { error } })
	}
}

export const getMyPortfolioData = async (req: Request, res: Response) => {
	Logger.info('Inside get my portfolio Data controller')
	try {
		const { id } = req.user
		const result = await getMyportfolioDataService(id, req.headers.authorization!)
		if (!result) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.WALLET_NOT_FOUND,
			})
		}
		return responseHandler({ res, data: result, msg: messages.PROJECT_FETCHED_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const getMyportfolio = async (req: Request, res: Response) => {
	Logger.info('Inside get my portfolio controller')
	try {
		const {
			offset,
			limit,
			orderBy,
			orderType,
			status,
			startDate,
			endDate,
			search,
			type,
			activity,
			category,
			methodology,
			country,
			sortCreatedAt,
			sortTitle,
			sortQuantity,
			sortType,
			sortActivity,
		} = req.query

		const strOffset: string = offset ? offset.toString() : '0'
		const strLimit: string = limit ? limit.toString() : '10'
		const strorderBy: string = orderBy !== undefined ? orderBy?.toString()! : 'createdAt'
		const strorderType: string = orderType !== undefined ? orderType?.toString()! : 'DESC'
		const project_status: string = status !== undefined ? status?.toString()! : ''
		const str_type: string = type !== undefined ? type?.toString()! : ''
		const str_activity: string = activity !== undefined ? activity?.toString()! : ''
		const str_category: string = category !== undefined ? category?.toString()! : ''
		const str_methodology: string = methodology !== undefined ? methodology?.toString()! : ''
		const str_country: string = country !== undefined ? country?.toString()! : ''
		const stDate: string = startDate !== undefined ? startDate?.toString() : ''
		const enDate: string = endDate ? endDate.toString() : new Date().toISOString().split('T')[0]
		const searchText: string = search !== undefined ? search?.toString()! : ''

		const strSortCreatedAt: string = sortCreatedAt !== undefined ? sortCreatedAt?.toString()! : ''
		const strSortTitle: string = sortTitle !== undefined ? sortTitle?.toString()! : ''

		const strSortQuantity: string = sortQuantity !== undefined ? sortQuantity?.toString()! : ''
		const strSortType: string = sortType !== undefined ? sortType?.toString()! : ''
		const strSortActivity: string = sortActivity !== undefined ? sortActivity?.toString()! : ''
		const { id } = req.user
		const result = await getMyportfolioService(
			id,
			parseInt(strOffset),
			parseInt(strLimit),
			strorderBy,
			strorderType,
			project_status,
			stDate,
			enDate,
			searchText,
			str_type,
			str_activity,
			str_category,
			str_methodology,
			str_country,
			strSortCreatedAt,
			strSortTitle,
			strSortQuantity,
			strSortType,
			strSortActivity,
			req.headers.authorization!
		)
		if (!result) {
			errorHandler({
				res,
				statusCode: 406,
				err: messages.WALLET_NOT_FOUND,
			})
		}
		return responseHandler({ res, data: result, msg: messages.PROJECT_FETCHED_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const investInProject = async (req: Request, res: Response) => {
	Logger.info('Inside Invest In Project controller')
	try {
		const { noOfCredits, transactionFees, totalCost, projectId } = req.body
		const { id } = req.user
		if (noOfCredits === 0) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.NO_OF_CREDIT_INVALID,
			})
		}

		const userData: any = await userDetailsById(id)
		if (!userData) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.USER_NOT_FOUND,
			})
		}
		if (userData.data.kycStatus !== 'APPROVED') {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.KYC_NOT_VERIFIED,
			})
		}
		const projectDetails: any = await projectDetailsById(parseInt(projectId))
		if (!projectDetails) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_NOT_FOUND,
			})
		}
		if (projectDetails?.data?.price_per_token === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PRICE_PER_TOKEN_NOT_FOUND,
			})
		}
		if (parseInt(noOfCredits) > projectDetails?.data?.noOfGTPAvailable) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.REQUEST_GTP_QUANTITY_EXIDS,
			})
		}
		const actualAmount = parseFloat(
			(projectDetails?.data?.price_per_token * parseInt(noOfCredits)).toFixed(2)
		)
		if (actualAmount !== parseFloat(totalCost)) {
			return errorHandler({
				res,
				statusCode: 406,
				err: `${messages.AMOUNT_NOT_MATCH}${actualAmount}`,
			})
		}

		const projectDataValues: ProjectsInterface = projectDetails?.data?.dataValues

		const nintyPercentOfCredits =
			(projectDataValues.noOfGTPSold! / projectDataValues.seed_credits!) * 100
		if (parseInt(nintyPercentOfCredits.toString()) < 90) {
			const data = projectDataValues.noOfGTPSold + noOfCredits
			const percentData = (data / projectDataValues.seed_credits!) * 100
			if (percentData >= 90) {
				await sendNotificationToProjectInv(
					projectId,
					'Project end soon',
					`${projectDataValues.title} is ending soon. Start investing`,
					false,
					true,
					`/view-project/${projectDataValues.id}`,
					'now',
					false
				)
			}
		}

		if (projectDataValues.currentNoOfInvestors! >= projectDataValues.totalNoOfInvestors!) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.INVESTOR_LIMIT_REACHED,
			})
		}
		const projectTransactionData: any = await getProjectTransactionService({ projectId })
		if (!projectTransactionData) {
			return errorHandler({
				res,
				statusCode: 500,
				err: messages.PROJECT_TRANSACTION_NOT_FOUND,
			})
		}
		if (projectTransactionData.tokenId === null) {
			return errorHandler({
				res,
				statusCode: 500,
				err: messages.GTP_TOKEN_NOT_MINTED,
			})
		}
		const projectDeveloper: any = await userDetailsById(projectDetails.data.userId)
		if (!projectDeveloper) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_DEVELOPER_NOT_FOUND,
			})
		}
		const blockchainData = await getBlockchainBalanceByUserIdService(parseInt(projectId), id)
		if (!blockchainData) {
			await updateProjectService(
				{ currentNoOfInvestors: projectDataValues.currentNoOfInvestors! + 1 },
				{ id: projectDataValues.id }
			)
		}
		let transferObj = {
			sourceWalletId: userData.data.walletId,
			sourceType: 'wallet',
			destinationWalletId: projectDetails.data.walletId,
			destinationType: 'wallet',
			amount: totalCost.toString(),
			currency: 'USD',
			userId: id,
		}
		const authoize = req.headers.authorization!

		const project: ProjectsInterface = projectDetails.data
		const { CcyCode: projectCurrencyPot, BaseCcyCode: projectCurrency } = project

		let projectWalletTransfer: any

		const user: UserInterface = userData.data
		const {
			email: userEmail,
			caxtonUserId: userCaxtonId,
			caxtonPassword: userCaxtonPassword,
		} = user

		const superAdmin = await getSuperAdminService(authoize)
		if (!superAdmin)
			return errorHandler({
				res,
				statusCode: 500,
				err: messages.ADMIN_FETCH_FAILED,
			})

		const {
			email: adminEmail,
			caxtonPassword: adminCaxtonPassword,
			feesPotCcyCode,
			caxtonUserId: adminCaxtonId,
		} = superAdmin

		// Implement caxton
		if (Config.PAYMENT.CAXTON.CAXTON_ENABLE) {
			if (!userCaxtonPassword) return

			const mainPot = await getMainPotBalance(
				{
					userAPIToken: '',
					userTokenExpire: '',
					userEmail,
					password: userCaxtonPassword,
					deviceId: '',
					device: '',
					operatingSystem: '',
					currency: projectCurrency!,
				},
				authoize
			)

			if (!mainPot)
				return errorHandler({
					res,
					statusCode: 500,
					err: messages.CXT_MAIN_POT_ERROR,
				})

			const amount = parseFloat(totalCost)
			if (mainPot.Balance < amount)
				return errorHandler({
					res,
					statusCode: 500,
					err: messages.CXT_MAIN_POT_BAL_ERROR,
				})

			//@note Transfer funds from investor main pot to investor project specific pot
			const potTransferRes = await transferBetweenPots(
				{
					userEmail,
					password: userCaxtonPassword,
					userAPIToken: '',
					userTokenExpire: '',
					fromCurrencyPot: projectCurrency!,
					toCurrencyPot: projectCurrencyPot!,
					amount,
					deviceId: '',
					device: '',
					operatingSystem: '',
					projectId: parseInt(project.id),
					projectTitle: project.title!,
				},
				authoize
			)

			if (!potTransferRes.status)
				return errorHandler({
					res,
					statusCode: potTransferRes.errorStatus,
					err: potTransferRes.errorMessage,
				})

			// @note Transfer funds from investor project specific pot to super admin project specific pot
			const accTransferRes = await transferBetweenAccounts(
				{
					userEmail,
					password: userCaxtonPassword,
					userAPIToken: '',
					userTokenExpire: '',
					caxtonUserId: adminCaxtonId!,
					sendCurrency: projectCurrencyPot!,
					amount,
					deviceId: '',
					device: '',
					operatingSystem: '',
					projectId: parseInt(project.id),
					projectTitle: project.title!,
				},
				authoize
			)

			if (!accTransferRes.status)
				return errorHandler({
					res,
					statusCode: accTransferRes.errorStatus,
					err: accTransferRes.errorMessage,
				})
		} else {
			projectWalletTransfer = await transferAmountInCircleWalletService(transferObj, authoize)
			if (projectWalletTransfer.statusCode === 500) {
				await axios
					.post(
						`${Config.NOTIFICATION.SEND}/${req.user.id}`,
						{
							title: 'Investment',
							body: `Investment of ${noOfCredits} credits for ${projectDataValues.title} has failed. [${projectWalletTransfer.err}]`,
							topic: `user-${req.user.id}`,
						},
						{
							headers: {
								authorization: req.headers.authorization!,
							},
						}
					)
					.catch((err) => {
						Logger.error(err)
					})
				return errorHandler({
					res,
					statusCode: 500,
					err: projectWalletTransfer.err,
				})
			}
		}

		const transferToken = {
			pincode: projectDeveloper.data.venlyPinCode,
			walletId: projectDeveloper.data.blockchainWalletId,
			walletAddress: projectDeveloper.data.blockchainWalletAddress,
			amount: noOfCredits,
			from: projectDeveloper.data.blockchainWalletAddress,
			to: userData.data.blockchainWalletAddress,
			id: projectTransactionData.tokenId,
		}
		const venlyResponse: any = (await axios
			.post(`${Config.WEB3.TRANSFER_GTP_TOKEN}`, transferToken, {
				headers: {
					authorization: req.headers.authorization!,
				},
			})
			.catch(async (err) => {
				Logger.error(err)

				await sendNotificationService(
					{
						title: 'Investment',
						body: `Investment of ${noOfCredits} credits for ${projectDataValues.title} has failed. [${err.response.data.msg}]`,
						topic: `user-${req.user.id}`,
					},
					req.user.id,
					req.headers.authorization!
				)
			}))!
		if (venlyResponse) {
			await updateYearlyProjectionService(parseInt(projectId), new Date(), {
				sold: parseInt(noOfCredits),
			})
			if (projectDetails?.data?.noOfGTPAvailable - parseInt(noOfCredits) === 0) {
				await updateProjectService(
					{
						live_seed_project: false,
						seed_status: 'completed',
						project_status: 'Seed Success',
						can_add_credits: true,
						canWithdraw: true,
					},
					{ id: projectDataValues.id }
				)
				await sendNotificationService(
					{
						title: 'Seed Success',
						body: `Congratulation! ${projectDetails?.data?.title} seed is successful. Now you can withdraw the amount by submitting invoices to platform admin.`,
						topic: `user-${projectDetails?.data?.userId}`,
					},
					projectDetails?.data?.userId,
					req.headers.authorization!
				)

				await sendNotificationToProjectInv(
					projectId,
					'Seed Success',
					`${projectDataValues.title} seed is successfully completed. You can check your next steps`,
					false,
					true,
					'portfolio',
					'here',
					false
				)
				let adminError: boolean = false
				let adminErrorMessage: string = ''
				const superAdmin = (await axios
					.get(`${Config.ADMIN.GET_SUPER_ADMIN}`, {
						headers: {
							authorization: req.headers.authorization!,
						},
					})
					.catch((err) => {
						Logger.error(err)
						adminError = true
						adminErrorMessage = err.response.data.msg
					}))!
				if (adminError) {
					await sendNotificationService(
						{
							title: 'Investment',
							body: `Investment of ${noOfCredits} credits for ${projectDataValues.title} has failed. [${adminErrorMessage}]`,
							topic: `user-${req.user.id}`,
						},
						req.user.id,
						req.headers.authorization!
					)

					return errorHandler({
						res,
						statusCode: 500,
						err: adminErrorMessage,
					})
				}
				const totalFees =
					parseFloat(projectDetails?.data?.total_project_raise_amount) -
					parseFloat(projectDetails?.data?.raise_amount)

				const authoize = req.headers.authorization!

				// @note Transfer funds from super admin project specific pot to super admin fees pot (seed success)
				if (Config.PAYMENT.CAXTON.CAXTON_ENABLE) {
					const potTransferRes = await transferBetweenPots(
						{
							userEmail: adminEmail,
							password: adminCaxtonPassword!,
							userAPIToken: '',
							userTokenExpire: '',
							fromCurrencyPot: projectCurrencyPot!,
							toCurrencyPot: feesPotCcyCode!,
							amount: totalFees,
							deviceId: '',
							device: '',
							operatingSystem: '',
							projectId: parseInt(project.id),
							projectTitle: project.title!,
						},
						authoize
					)

					if (!potTransferRes.status)
						return errorHandler({
							res,
							statusCode: potTransferRes.errorStatus,
							err: potTransferRes.errorMessage,
						})
				} else {
					const transferObj = {
						sourceWalletId: projectDetails?.data?.walletId,
						sourceType: 'wallet',
						destinationWalletId: superAdmin.data.data.walletId,
						destinationType: 'wallet',
						amount: totalFees.toString(),
						currency: 'USD',
						userId: superAdmin.data.data.id.toString(),
					}

					const superAdminWalletTrasfer: any = await transferAmountInCircleWalletService(
						transferObj,
						authoize
					)
					if (superAdminWalletTrasfer.statusCode === 500) {
						await sendNotificationService(
							{
								title: 'Investment',
								body: `Investment of ${noOfCredits} credits for ${projectDataValues.title} has failed. [${superAdminWalletTrasfer.err}]`,
								topic: `user-${req.user.id}`,
							},
							req.user.id,
							req.headers.authorization!
						)

						return errorHandler({
							res,
							statusCode: 500,
							err: superAdminWalletTrasfer.err,
						})
					}
				}
			}

			await sendNotificationService(
				{
					title: 'Investment',
					body: `${noOfCredits} credits for ${projectDataValues.title} are purchased successfully. Please check your portfolio to know more.`,
					topic: `user-${req.user.id}`,
				},
				req.user.id,
				req.headers.authorization!
			)

			await updateNotifyMeService(parseInt(projectDataValues.id), req.user.id, { isInvested: true })
			return responseHandler({
				res,
				msg: messages.GTP_TOKEN_TRANSFER_SUCCESS,
			})
		} else {
			if (Config.PAYMENT.CAXTON.CAXTON_ENABLE) {
				// @note refund to investor from super admin project specific pot to investor project specific pot
				const accTransferRes = await transferBetweenAccounts(
					{
						userEmail: adminEmail,
						password: adminCaxtonPassword!,
						userAPIToken: '',
						userTokenExpire: '',
						caxtonUserId: userCaxtonId!,
						sendCurrency: projectCurrencyPot!,
						amount: parseFloat(totalCost),
						deviceId: '',
						device: '',
						operatingSystem: '',
						projectId: parseInt(project.id),
						projectTitle: project.title!,
					},
					authoize
				)

				if (!accTransferRes.status)
					return errorHandler({
						res,
						statusCode: accTransferRes.errorStatus,
						err: accTransferRes.errorMessage,
					})

				//@note revert investor project specific pot to investor main pot
				const potTransferRes = await transferBetweenPots(
					{
						userEmail,
						password: userCaxtonPassword!,
						userAPIToken: '',
						userTokenExpire: '',
						fromCurrencyPot: projectCurrencyPot!,
						toCurrencyPot: projectCurrency!,
						amount: parseFloat(totalCost),
						deviceId: '',
						device: '',
						operatingSystem: '',
						projectId: parseInt(project.id),
						projectTitle: project.title!,
					},
					authoize
				)

				if (!potTransferRes.status)
					return errorHandler({
						res,
						statusCode: potTransferRes.errorStatus,
						err: potTransferRes.errorMessage,
					})
			} else {
				const updateTransactionObj = {
					transactionId: projectWalletTransfer.data.data.data.id,
					tokenStatus: 'failed',
				}
				const circleData: any = (await axios
					.put(`${Config.PAYMENT.UPDATE_TRANSACTION}`, updateTransactionObj, {
						headers: {
							authorization: req.headers.authorization!,
						},
					})
					.catch(async (err) => {
						Logger.error(err)

						await sendNotificationService(
							{
								title: 'Investment',
								body: `Investment of ${noOfCredits} credits for ${projectDataValues.title} has failed. [${err.response.data.msg}]`,
								topic: `user-${req.user.id}`,
							},
							req.user.id,
							req.headers.authorization!
						)

						return errorHandler({
							res,
							statusCode: 406,
							err: err.response.data.msg,
						})
					}))!
				if (!circleData) {
					await sendNotificationService(
						{
							title: 'Investment',
							body: `Investment of ${noOfCredits} credits for ${projectDataValues.title} has failed. [Some thing went wrong while updating transaction]`,
							topic: `user-${req.user.id}`,
						},
						req.user.id,
						req.headers.authorization!
					)

					return errorHandler({
						res,
						statusCode: 406,
						err: 'Some thing went wrong while updating transaction',
					})
				}

				await sendNotificationService(
					{
						title: 'Investment',
						body: `Investment of ${noOfCredits} credits for ${projectDataValues.title} has failed. [${messages.GTP_TOKEN_TRANSFER_FAILED}]`,
						topic: `user-${req.user.id}`,
					},
					req.user.id,
					req.headers.authorization!
				)
			}

			return errorHandler({
				res,
				statusCode: 406,
				err: messages.GTP_TOKEN_TRANSFER_FAILED,
			})
		}
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const updateVccTokenTransaction = async (req: Request, res: Response) => {
	Logger.info('Inside Update Project Transaction controller')
	try {
		const { txHash, tokenId }: { txHash: string; tokenId: string } = req.body

		const trasactionData = await updateVccTokenTransactionService(
			{ tokenId },
			{ transactionHash: txHash }
		)
		if (!trasactionData) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_TRANSACTION_UPDATE_FAILED,
			})
		}
		return responseHandler({
			res,
			msg: messages.PROJECT_TRANSACTION_UPDATE_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const getGtpMintedProjects = async (req: Request, res: Response) => {
	Logger.info('Inside Get All Project Controller')
	try {
		const offset = req.query?.offset?.toString() || '0'
		const limit = req.query?.limit?.toString() || '10'
		const search = req.query?.search?.toString() || undefined
		const orderBy = req.query?.orderBy?.toString() || 'createdAt'
		const orderType = req.query?.orderType?.toString() || 'DESC'

		if (Number(limit) > 20) {
			return errorHandler({
				res,
				statusCode: 402,
				err: messages.FETCH_LIMIT_EXCEEDED,
			})
		}

		if (!(orderType === 'ASC' || orderType === 'DESC')) {
			return errorHandler({
				res,
				statusCode: 402,
				err: messages.ORDER_TYPE_ERROR,
			})
		}

		const projects = await getProjectsService(
			{
				set_live_date: true,
			},
			{
				offset: parseInt(offset),
				limit: parseInt(limit),
				attributes: ['title', 'id'],
				order: [[orderBy, orderType]],
			},
			search
		)
		if (!projects)
			return errorHandler({
				res,
			})

		let responseData: {
			title: string
			id: string
			tokenId: string | null
			contractAddress: string
		}[]

		if (orderBy === 'tokenId') {
			responseData = projects.rows.map((project: any) => {
				project.contractAddress = Config.WEB3.GTP_CONTRACT_ADDRESS!
				return project
			})
		} else {
			const projectTokenIds = await getProjectsTokenIdService(projects.rows)
			if (!projectTokenIds)
				return errorHandler({
					res,
				})

			responseData = projects.rows.map((project) => {
				const tokenId = projectTokenIds.find(
					(projectToken) => project.id === projectToken.projectId
				)
				return {
					title: project.title,
					id: project.id,
					tokenId: tokenId?.tokenId ?? null,
					contractAddress: Config.WEB3.GTP_CONTRACT_ADDRESS!,
				}
			})
		}

		return responseHandler({
			res,
			data: {
				count: projects.count,
				rows: responseData,
			},
			msg: messages.PROJECT_FETCHED_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, err: messages.INTERNAL_ERROR })
	}
}

export const getAllTransactions = async (req: Request, res: Response) => {
	Logger.info('inside get all transactions')
	try {
		const { offset, limit, orderBy, orderType, event, startDate, endDate } = req.query

		const strOffset: string = offset ? offset.toString() : '0'
		const strLimit: string = limit ? limit.toString() : '10'
		const strorderBy: string = orderBy !== undefined ? orderBy?.toString()! : 'createdAt'
		const strorderType: string = orderType !== undefined ? orderType?.toString()! : 'DESC'
		const transaction_event: string = event !== undefined ? event?.toString()! : ''
		const stDate: string = startDate !== undefined ? startDate?.toString() : ''
		const enDate: string = endDate ? endDate.toString() : new Date().toISOString().split('T')[0]
		const { id } = req.user

		const result = await getAllTranctonsService(
			id,
			parseInt(strOffset),
			parseInt(strLimit),
			strorderBy,
			strorderType,
			transaction_event,
			stDate,
			enDate
		)

		return responseHandler({ res, data: result, msg: messages.ALL_TRANSACTIONS_FETCHED_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const getTransaction = async (req: Request, res: Response) => {
	Logger.info('inside get transaction controller')
	try {
		const id = req.params.transactionId
		const userId = req.user.id

		const result = await getTransactionService(id, userId)
		if (result === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_TRANSACTION_NOT_FOUND,
			})
		}
		return responseHandler({ res, data: result, msg: messages.TRANSACTION_FETCHED_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const getAllBalances = async (req: Request, res: Response) => {
	Logger.info('inside get all balances controller')
	try {
		const { offset, limit, orderBy, orderType } = req.query

		const strOffset: string = offset ? offset.toString() : '0'
		const strLimit: string = limit ? limit.toString() : '10'
		const strorderBy: string = orderBy !== undefined ? orderBy?.toString()! : 'createdAt'
		const strorderType: string = orderType !== undefined ? orderType?.toString()! : 'DESC'
		const { id } = req.user

		const result = await getAllBalanceService(
			id,
			parseInt(strOffset),
			parseInt(strLimit),
			strorderBy,
			strorderType
		)

		return responseHandler({ res, data: result, msg: messages.ALL_BALANCE_FETCHED_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const getBalance = async (req: Request, res: Response) => {
	Logger.info('inside get balances controller')
	try {
		const id = req.params.balanceId
		const userId = req.user.id

		const balance = await getBalanceService(id, userId)
		if (balance === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.BALANCE_FETCHED_FAILED,
			})
		}
		return responseHandler({ res, data: balance, msg: messages.BALANCE_FETCHED_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const getTotalGTPAndVCC = async (req: Request, res: Response) => {
	Logger.info('inside get totla GTP and VCC controller')
	try {
		const user: UserInterface = req.user
		let result: { totalGTP: number; totalVCC: number }

		if (user.userType === 'INVESTOR') {
			result = await getInvestorTotalGTPAndVCCService(user.id)
		}

		if (user.userType === 'PROJECT_DEVELOPER') {
			result = await getDeveloperTotalGTPAndVCCService(user.id)
		}

		return responseHandler({ res, data: result!, msg: messages.TOTAL_GTP_VCC_FETCHED_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const getUserInvestedProjects = async (req: Request, res: Response) => {
	Logger.info('inside get User Invested Projects controller')
	try {
		const { userId } = req.params
		const offset: string = req.query?.offset?.toString() || '0'
		const limit: string = req.query?.limit?.toString() || '10'

		const data = await getUserInvestedProjectsVccService(userId, parseInt(offset), parseInt(limit))
		if (!data) return errorHandler({ res, err: messages.INTERNAL_ERROR })

		return responseHandler({ res, data, msg: messages.USER_INVESTED_PROJECTS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const getAllVccTrasactions = async (req: Request, res: Response) => {
	try {
		const { offset, limit, orderBy, orderType, startDate, endDate, status } = req.query

		const strOffset: string = offset ? offset.toString() : '0'
		const strLimit: string = limit ? limit.toString() : '10'
		const strorderBy: string = orderBy !== undefined ? orderBy?.toString()! : 'createdAt'
		const strorderType: string = orderType !== undefined ? orderType?.toString()! : 'DESC'
		const strStatus: string = status !== undefined ? status.toString() : ''
		const stDate: string = startDate !== undefined ? startDate?.toString() : ''
		const enDate: string = endDate ? endDate.toString() : new Date().toISOString().split('T')[0]
		const { id } = req.user

		const result = await getAllVccTranctonsService(
			id,
			parseInt(strOffset),
			parseInt(strLimit),
			strorderBy,
			strorderType,
			strStatus,
			stDate,
			enDate
		)

		return responseHandler({
			res,
			data: result,
			msg: messages.ALL_VCC_TRANSACTIONS_FETCHED_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const addCountriesData = async (req: Request, res: Response) => {
	Logger.info('inside add countries data controller')
	try {
		const { data } = req.body
		const countryData = await addCountriesDataService(data)
		return responseHandler({
			res,
			data: countryData,
			msg: messages.COUNTRIES_DATA_ADDED_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}
export const transferProjectFees = async (req: Request, res: Response) => {
	Logger.info('Inside Transfer Project Fees controller')
	try {
		const { projectId } = req.params
		const projectDetails: any = await projectDetailsById(parseInt(projectId))
		if (!projectDetails) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_NOT_FOUND,
			})
		}
		if (projectDetails?.data?.is_fees_paid) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_FEES_ALREADY_PAID,
			})
		}
		const totalAmountrequested = projectDetails?.data?.total_project_raise_amount
		const totalAmountRaised =
			projectDetails?.data?.price_per_token * projectDetails?.data?.noOfGTPSold
		if (totalAmountRaised < totalAmountrequested) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.Total_RAISED_AMOUNT_NOT_ACCHIEVED,
			})
		}
		let adminError: boolean = false
		let adminErrorMessage: string = ''
		const superAdmin = (await axios
			.get(`${Config.ADMIN.GET_SUPER_ADMIN}`, {
				headers: {
					authorization: req.headers.authorization!,
				},
			})
			.catch((err) => {
				Logger.error(err)
				adminError = true
				adminErrorMessage = err.response.data.msg
			}))!
		if (adminError) {
			return errorHandler({
				res,
				statusCode: 500,
				err: adminErrorMessage,
			})
		}
		const totalFees =
			parseInt(projectDetails?.data?.total_project_raise_amount) -
			parseInt(projectDetails?.data?.raise_amount)
		const transferObj = {
			sourceWalletId: projectDetails?.data?.walletId,
			sourceType: 'wallet',
			destinationWalletId: superAdmin.data.data.walletId,
			destinationType: 'wallet',
			amount: totalFees.toString(),
			currency: 'USD',
			userId: superAdmin.data.data.id.toString(),
		}
		const authoize = req.headers.authorization!

		// @note Caxton: Transfer Fees from super admin project specific pot to fees pot ( Seed failed )
		if (Config.PAYMENT.CAXTON.CAXTON_ENABLE) {
			const {
				feesPotCcyCode,
				email: adminEmail,
				caxtonPassword: adminCaxtonPassword,
			} = superAdmin.data.data

			if (!adminCaxtonPassword) return

			const potTransferRes = await transferBetweenPots(
				{
					userEmail: adminEmail,
					password: adminCaxtonPassword,
					userAPIToken: '',
					userTokenExpire: '',
					fromCurrencyPot: projectDetails?.data?.CcyCode!,
					toCurrencyPot: feesPotCcyCode,
					amount: totalFees,
					deviceId: '',
					device: '',
					operatingSystem: '',
					projectId: parseInt(projectDetails?.data?.id),
					projectTitle: projectDetails?.data?.title!,
				},
				authoize
			)

			if (!potTransferRes.status)
				return errorHandler({
					res,
					statusCode: potTransferRes.errorStatus,
					err: potTransferRes.errorMessage,
				})
		} else {
			const superAdminWalletTrasfer: any = await transferAmountInCircleWalletService(
				transferObj,
				authoize
			)
			if (superAdminWalletTrasfer.statusCode === 500) {
				return errorHandler({
					res,
					statusCode: 500,
					err: superAdminWalletTrasfer.err,
				})
			}
		}

		return responseHandler({ res, msg: messages.FEES_TRANSFER_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const getCountriesData = async (req: Request, res: Response) => {
	Logger.info('inside get countries data controller')
	try {
		const { orderBy, orderType, circle } = req.query

		const strorderBy: string = orderBy !== undefined ? orderBy?.toString()! : 'country'
		const strorderType: string = orderType !== undefined ? orderType?.toString()! : 'ASC'
		let isCircle: any
		if (circle === 'true') {
			isCircle = true
		} else if (circle === 'false') {
			isCircle = false
		} else {
			isCircle = ''
		}
		const countryData = await getCountriesDataService(strorderBy, strorderType, isCircle)
		return responseHandler({
			res,
			data: countryData,
			msg: messages.ALL_COUNTRY_FETCHED_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const RetireGTP = async (req: Request, res: Response) => {
	Logger.info('Inside Retire GTP controller')
	try {
		const { projectId, noOfGTP, offset } = req.body
		const { id } = req.user
		const projectData: any = await projectDetailsById(projectId)
		if (projectData === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_NOT_FOUND,
			})
		}
		const userData: any = await userDetailsById(id)
		if (userData === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.USER_NOT_FOUND,
			})
		}
		const projectTransactionData: any = await getProjectTransactionService({ projectId })
		if (!projectTransactionData) {
			return errorHandler({
				res,
				statusCode: 500,
				err: messages.PROJECT_TRANSACTION_NOT_FOUND,
			})
		}
		if (projectData.data.vcc_issued === 0 || projectData.data.vcc_issued < parseInt(noOfGTP)) {
			return errorHandler({
				res,
				statusCode: 401,
				err: messages.VCC_LESS_THEN_GTP,
			})
		}
		const retireObj = {
			pincode: userData.data.venlyPinCode,
			walletId: userData.data.blockchainWalletId,
			walletAddress: userData.data.blockchainWalletAddress,
			tokenId: parseInt(projectTransactionData.tokenId),
			amount: noOfGTP,
			offset: offset,
		}
		const swapResponse: any = (await axios
			.post(`${Config.WEB3.SWAP_META_TRANSACTION}`, retireObj, {
				headers: {
					authorization: req.headers.authorization!,
				},
			})
			.catch((err) => {
				Logger.error(err)
				return errorHandler({
					res,
					statusCode: 406,
					err: err.response.data.msg,
				})
			}))!
		if (!swapResponse) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.GTP_RETIRE_FAILED,
			})
		}
		if (swapResponse.data.data.txHash) {
			const remainingVCC = parseInt(projectData.data.vcc_issued) - parseInt(noOfGTP)
			await updateProjectService({ vcc_issued: remainingVCC }, { id: projectId })

			await sendNotificationService(
				{
					title: 'Retire Success',
					body: `Congratulation! Your retirement of ${noOfGTP} GTP for ${projectData.data.title} is successful.`,
					topic: `user-${req.user.id}`,
				},
				req.user.id,
				req.headers.authorization!
			)
		}
		responseHandler({
			res,
			data: swapResponse.data.data.txHash,
			msg: messages.RETIRE_REQUEST_SUCCESS,
		})

		const eventRetirement = socketEvents.io.volatile.emit('retirement', 'data Updated')
		Logger.info(`eventRetirement ${eventRetirement}`)
		return
	} catch (error) {
		Logger.error(error)
		return errorHandler({ res, data: { error } })
	}
}

export const getCountryData = async (req: Request, res: Response) => {
	Logger.info('inside get country data controller')
	try {
		const id = req.params.countryId
		const countryData = await getcountryDataService(parseInt(id))

		if (countryData === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.COUNTRY_FETCHED_FAILED,
			})
		}

		return responseHandler({
			res,
			data: countryData!,
			msg: messages.COUNTRY_FETCHED_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const signDocument = async (req: Request, res: Response) => {
	Logger.info('inside sign document controller')
	try {
		const id = req.params.projectId
		const userId = req.user.id

		const projectData = await projectDetailsById(parseInt(id))

		const check = await checkRequiredFields(projectData?.data?.toJSON())
		if (!check) return errorHandler({ res, statusCode: 206, err: messages.REQUIRED_FIELDS_MISSING })

		const result = await documentsignService(parseInt(id), userId)
		if (result === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_NOT_FOUND,
			})
		}

		await sendNotificationService(
			{
				title: 'Project Published',
				body: `Congratulation! Your project is published successfully. You can check your next steps`,
				topic: `user-${req.user.id}`,
				hasLink: true,
				link: 'my-projects',
				linkMsg: 'here',
			},
			req.user.id,
			req.headers.authorization!
		)

		return responseHandler({
			res,
			data: { id },
			msg: messages.PROJECT_SUBMIT_DOC_SIGNED_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const createVCCTokenTransaction = async (req: Request, res: Response) => {
	Logger.info('Inside Create VCC Token Transaction controller')
	try {
		const { transactionHash, tokenId, amount, startIndex, from, to } = req.body
		const projectTransactionData: any = await getProjectTransactionService({ tokenId })
		if (!projectTransactionData) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_TRANSACTION_NOT_FOUND,
			})
		}
		const projectData: any = await projectDetailsById(parseInt(projectTransactionData.projectId))
		if (projectData === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_NOT_FOUND,
			})
		}
		const userData: any = await getUserByWalletAddress(to)
		if (!userData) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.USER_NOT_FOUND,
			})
		}
		let tokenArray: Array<string> = []
		const endIndex = parseInt(startIndex) + parseInt(amount)
		for (let i = parseInt(startIndex); i < endIndex; i++) {
			tokenArray.push(i.toString())
		}
		const vccTokenObj: VccTokenTransactionInterface = {
			id: uuid(),
			transactionHash: transactionHash,
			tokenId,
			projectId: parseInt(projectData.data.id),
			projectTitle: projectData.data.title,
			projectMethodology: projectData.data.methodology,
			vccQuantity: parseInt(amount),
			vccTokenId: tokenArray,
			userId: userData.id,
			toWalletAddress: to,
			fromWalletAddress: from,
			transactionStatus: 'Complete',
			retireBy: userData.name !== null ? userData.name : userData.companyName,
		}
		const blockchainUpdateData = await updateBlockchainBalance(
			parseInt(projectData.data.id),
			tokenId,
			userData.id,
			projectData.data.title,
			parseInt(amount),
			tokenArray
		)
		if (!blockchainUpdateData) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.BLOCKCHAIN_BALANCE_UPDATE_FAILED,
			})
		}
		const vccTokenData = await createVccTokenTransactionService(vccTokenObj)
		if (!vccTokenData) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.VCC_TOKEN_TRANSACTION_FAILED,
			})
		}
		await updateYearlyProjectionService(parseInt(projectData.data.id), new Date(), {
			credit_retired: parseInt(amount),
		})

		return responseHandler({
			res,
			msg: messages.VCC_TOKEN_TRANSACTION_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const getProjectDevDashboardGraph = async (req: Request, res: Response) => {
	Logger.info('inside get ProjectDev Dashboard Graph Controller')
	try {
		const project = await getProjectService(
			{ id: req.params.projectId },
			{ attributes: ['id', 'seed_credits'] }
		)
		if (!project)
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_NOT_FOUND,
			})

		const data = await getProjectDevDashboardGraphService(project)

		return responseHandler({
			res,
			data,
			msg: messages.GRAPH_DATA_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}
export const createTokenTransactionAfterSwap = async (req: Request, res: Response) => {
	Logger.info('Inside Create Token Transaction After Swap controller')
	try {
		const { txHash, tokenId, from, to, amount } = req.body
		const projectTransactionData: any = await getProjectTransactionService({ tokenId })
		if (!projectTransactionData) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_TRANSACTION_NOT_FOUND,
			})
		}
		const userData: any = await getUserByWalletAddress(from)
		const payload: TokenTransactionInterface = {
			id: uuid(),
			transactionHash: txHash,
			tokenId,
			projectId: projectTransactionData.projectId,
			tokenQuantity: parseInt(amount),
			fromWalletAddress: from,
			toWalletAddress: to,
			eventType: 'Burn',
			userId: userData.id,
		}
		const tokenTransactionData = await createTokenTransactionService(payload)
		if (!tokenTransactionData) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.TOKEN_TRANSACTION_CREATE_FAILED,
			})
		}
		return responseHandler({
			res,
			data: tokenTransactionData,
			msg: messages.TOKEN_TRANSACTION_CREATE_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const getProjectDevProjects = async (req: Request, res: Response) => {
	Logger.info('inside get all project details controller')
	try {
		const { offset, limit, orderBy, orderType } = req.query

		const strOffset: string = offset ? offset.toString() : '0'
		const strLimit: string = limit ? limit.toString() : '10'
		const strorderBy: string = orderBy !== undefined ? orderBy?.toString()! : 'createdAt'
		const strorderType: string = orderType !== undefined ? orderType?.toString()! : 'DESC'
		const { id } = req.user

		const result = await getProjectDevProjectsService(
			parseInt(strOffset),
			parseInt(strLimit),
			strorderBy,
			strorderType,
			id
		)

		return responseHandler({ res, data: result, msg: messages.PROJECT_FETCHED_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const getInvestedProjects = async (req: Request, res: Response) => {
	Logger.info('inside get invested Projects')
	try {
		const { offset, limit, orderBy, orderType } = req.query

		const strOffset: string = offset ? offset.toString() : '0'
		const strLimit: string = limit ? limit.toString() : '10'
		const strorderBy: string = orderBy !== undefined ? orderBy?.toString()! : 'createdAt'
		const strorderType: string = orderType !== undefined ? orderType?.toString()! : 'DESC'
		const { id } = req.user

		const result = await getAllInvestedProjectsService(
			parseInt(strOffset),
			parseInt(strLimit),
			strorderBy,
			strorderType,
			id
		)

		return responseHandler({ res, data: result, msg: messages.PROJECT_FETCHED_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}
export const getInvestorDashboardGraph = async (req: Request, res: Response) => {
	Logger.info('inside get Investor Dashboard Graph Controller')
	try {
		const project = await getProjectService(
			{ id: req.params.projectId },
			{ attributes: ['id', 'total_vcc_issued', 'noOfGTPAvailable'] }
		)
		if (!project)
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_NOT_FOUND,
			})

		const data = await getInvestorDashboardGraphService(req.user.id, project)

		return responseHandler({
			res,
			data,
			msg: messages.GRAPH_DATA_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const getstateData = async (req: Request, res: Response) => {
	Logger.info('inside get state Data controller')
	try {
		const { countryName } = req.params
		const allStates = await getstateDataService(countryName)

		if (allStates === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.STATES_FETCHED_FAILED,
			})
		}
		return responseHandler({
			res,
			data: allStates,
			msg: messages.ALL_STATES_FETCHED_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const getDistrictData = async (req: Request, res: Response) => {
	Logger.info('inside get district Data controller')
	try {
		const { countryName } = req.params
		const allData = await getDistrictDataService(countryName)

		if (allData === null) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.DISTRICTS_FETCHED_FAILED,
			})
		}
		return responseHandler({
			res,
			data: allData,
			msg: messages.ALL_DISTRICTS_FETCHED_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const getInvestorSummaryDashboardGraph = async (req: Request, res: Response) => {
	Logger.info('inside get Investor Dashboard Graph Controller')
	try {
		const data = await getInvestorDashboardGraphService(req.user.id)

		return responseHandler({
			res,
			data: {
				...data,
				summary: true,
			},
			msg: messages.GRAPH_DATA_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const getRetiredCredits = async (req: Request, res: Response) => {
	Logger.info('inside get Retired Credits Controller')
	try {
		const data = await getRetiredCreditsService(req.user.id)
		if (!data)
			return errorHandler({
				res,
				err: messages.INTERNAL_ERROR,
			})

		const { totalCreditsRetired, totalCarbonSupply } = await getTotalRetiredCreditsService()
		return responseHandler({
			res,
			data: {
				...data,
				totalCreditsRetired,
				totalCarbonSupply,
			},
			msg: messages.RETIRED_CREDITS_DATA_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, err: messages.INTERNAL_ERROR })
	}
}

export const getTotalRetiredCredits = async (req: Request, res: Response) => {
	Logger.info('inside get Total Retired Credits Controller')
	try {
		const data = await getTotalRetiredCreditsService()
		if (!data)
			return errorHandler({
				res,
				err: messages.INTERNAL_ERROR,
			})

		return responseHandler({
			res,
			data,
			msg: messages.TOTAL_RETIRED_CREDITS_DATA_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, err: messages.INTERNAL_ERROR })
	}
}

export const getInvestorDetails = async (req: Request, res: Response) => {
	Logger.info('inside Get Investor Details Controller')
	try {
		const { offset, limit, orderBy, orderType } = req.query
		const { projectId } = req.params
		const strOffset: string = offset ? offset.toString() : '0'
		const strLimit: string = limit ? limit.toString() : '10'
		const strorderBy: string = orderBy !== undefined ? orderBy?.toString()! : 'createdAt'
		const strorderType: string = orderType !== undefined ? orderType?.toString()! : 'DESC'
		const investorDetails = await getInvestorDetailsService(
			parseInt(strOffset),
			parseInt(strLimit),
			strorderBy,
			strorderType,
			parseInt(projectId)
		)
		return responseHandler({
			res,
			data: investorDetails,
			msg: messages.INVESTOR_DETAIL_FETCH_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, err: messages.INTERNAL_ERROR })
	}
}

export const getCreditRealised = async (req: Request, res: Response) => {
	Logger.info('inside Get Credit Realised Controller')
	try {
		const { offset, limit, orderBy, orderType } = req.query
		const { projectId } = req.params
		const strOffset: string = offset ? offset.toString() : '0'
		const strLimit: string = limit ? limit.toString() : '10'
		const strorderBy: string = orderBy !== undefined ? orderBy?.toString()! : 'createdAt'
		const strorderType: string = orderType !== undefined ? orderType?.toString()! : 'DESC'
		const creditRealised = await getCreditRealisedService(
			parseInt(strOffset),
			parseInt(strLimit),
			strorderBy,
			strorderType,
			parseInt(projectId)
		)
		return responseHandler({
			res,
			data: creditRealised,
			msg: messages.INVESTOR_DETAIL_FETCH_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, err: messages.INTERNAL_ERROR })
	}
}

export const getUserRetireHistory = async (req: Request, res: Response) => {
	Logger.info('inside get user Retire History Controller')
	try {
		const {
			offset,
			limit,
			orderBy,
			orderType,
			country,
			project_type,
			activity,
			methodology,
			startDate,
			endDate,
			search,
			sortCreatedAt,
			sortTitle,
			sortQuantity,
			sortType,
			sortActivity,
		} = req.query

		const strOffset: string = offset ? offset.toString() : '0'
		const strLimit: string = limit ? limit.toString() : '10'
		const strorderBy: string = orderBy !== undefined ? orderBy?.toString()! : 'createdAt'
		const strorderType: string = orderType !== undefined ? orderType?.toString()! : 'DESC'
		const strCountry: string = country !== undefined ? country.toString() : ''
		const strProject_type: string = project_type !== undefined ? project_type.toString() : ''
		const strActivity: string = activity !== undefined ? activity.toString() : ''
		const strMethodology: string = methodology !== undefined ? methodology.toString() : ''

		const strDate: string = startDate !== undefined ? startDate?.toString() : ''
		const enDate: string = endDate ? endDate.toString() : new Date().toISOString().split('T')[0]

		const searchText: string = search !== undefined ? search?.toString()! : ''

		const strSortCreatedAt: string = sortCreatedAt !== undefined ? sortCreatedAt?.toString()! : ''
		const strSortTitle: string = sortTitle !== undefined ? sortTitle?.toString()! : ''

		const strSortQuantity: string = sortQuantity !== undefined ? sortQuantity?.toString()! : ''
		const strSortType: string = sortType !== undefined ? sortType?.toString()! : ''
		const strSortActivity: string = sortActivity !== undefined ? sortActivity?.toString()! : ''

		const { id } = req.user
		const result = await getRetireHistoryService(
			id,
			parseInt(strOffset),
			parseInt(strLimit),
			strorderBy,
			strorderType,
			strCountry,
			strProject_type,
			strActivity,
			strMethodology,
			strDate,
			enDate,
			searchText,
			strSortCreatedAt,
			strSortTitle,
			strSortQuantity,
			strSortType,
			strSortActivity
		)
		return responseHandler({ res, data: result, msg: messages.RETIRE_HISTORY_FETCHED_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, err: messages.INTERNAL_ERROR })
	}
}

export const updateRoadmapValidationStatus = async (req: Request, res: Response) => {
	Logger.info('inside Update Roadmap Validation Status Controller')
	try {
		const { roadmapId, status, validationDateData } = req.body
		const verificationDate = validationDateData ? new Date(validationDateData) : null
		const payload = {
			roadmapId,
			status,
			verificationDate,
		}
		await updateRoadmapValidationStatusService(payload)
		return responseHandler({
			res,
			msg: messages.ROADMAP_STATUS_UPDATED,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, err: messages.INTERNAL_ERROR })
	}
}

export const updateRoadmapValidation = async (req: Request, res: Response) => {
	Logger.info('inside Update Roadmap Validation Controller')
	try {
		const { roadmapId, verification, subVerification } = req.body
		const payload = {
			roadmapId,
			verification,
			subVerification,
		}
		await updateRoadmapValidationService(payload)
		return responseHandler({
			res,
			msg: messages.ROADMAP_UPDATED,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, err: messages.INTERNAL_ERROR })
	}
}

export const createRoadmap = async (req: Request, res: Response) => {
	Logger.info('inside Create Roadmap Controller')
	try {
		const { projectId, verification, subVerification } = req.body
		const payload = {
			projectId: parseInt(projectId),
			verification,
			subVerification,
		}
		const roadmapData = await createRoadmapService(payload)
		if (!roadmapData) {
			return errorHandler({
				res,
				err: messages.ROADMAP_CREATE_FAILED,
			})
		}
		return responseHandler({
			res,
			msg: messages.ROADMAP_CREATE_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, err: messages.INTERNAL_ERROR })
	}
}

export const deleteRoadmapValidation = async (req: Request, res: Response) => {
	Logger.info('inside Delete Roadmap Validation Controller')
	try {
		const { roadmapId } = req.params
		const roadmapData = await deleteRoadmapValidationService(roadmapId)
		if (!roadmapData) {
			return errorHandler({
				res,
				err: messages.ROADMAP_DELETE_FAILED,
			})
		}
		return responseHandler({
			res,
			msg: messages.ROADMAP_DELETE_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, err: messages.INTERNAL_ERROR })
	}
}

export const getAvailableCreditsToRetire = async (req: Request, res: Response) => {
	Logger.info('inside get Available Credits To Retire ')
	try {
		const { projectId } = req.params
		const project = await getProjectService(
			{
				id: projectId,
			},
			{
				attributes: ['id', 'vcc_issued'],
			}
		)

		if (!project)
			return errorHandler({
				res,
				err: messages.PROJECT_NOT_FOUND,
			})

		const data = await getAvailableCreditsToRetireService(req.user.id, project)
		if (!data)
			return errorHandler({
				res,
				err: messages.INTERNAL_ERROR,
			})

		return responseHandler({
			res,
			data,
			msg: messages.RETIRED_CREDITS_DATA_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, err: messages.INTERNAL_ERROR })
	}
}

export const getAllRoadMap = async (req: Request, res: Response) => {
	Logger.info('inside get all road map Controller')
	try {
		const { offset, limit, orderBy, orderType } = req.query
		const { projectId } = req.params
		const strOffset: string = offset ? offset.toString() : '0'
		const strLimit: string = limit ? limit.toString() : '10'
		const strorderBy: string = orderBy !== undefined ? orderBy?.toString()! : 'createdAt'
		const strorderType: string = orderType !== undefined ? orderType?.toString()! : 'DESC'
		const result = await getAllRoadMapService(
			parseInt(projectId),
			parseInt(strOffset),
			parseInt(strLimit),
			strorderBy,
			strorderType
		)

		return responseHandler({ res, data: result, msg: messages.ALL_ROADMAPS_DATA_FETCHED_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, err: messages.INTERNAL_ERROR })
	}
}

export const listProjectsToRetireGTP = async (req: Request, res: Response) => {
	Logger.info('inside list Projects To Retire GTP')
	try {
		const data = await listProjectsToRetireGTPService(req.user.id)
		if (!data)
			return errorHandler({
				res,
				err: messages.INTERNAL_ERROR,
			})

		return responseHandler({
			res,
			data,
			msg: messages.LIST_PROJECTS_TO_RETIRE_GTP,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, err: messages.INTERNAL_ERROR })
	}
}

export const getRoadmap = async (req: Request, res: Response) => {
	Logger.info('Inside get road map controller')
	try {
		const { id } = req.params
		const roadmap = await getRoadmapService(id)
		if (roadmap === null) {
			return errorHandler({
				res,
				err: messages.ROADMAP_NOT_FOUND,
			})
		}
		return responseHandler({ res, data: roadmap, msg: messages.ROADMAPS_DATA_FETCHED_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, err: messages.INTERNAL_ERROR })
	}
}

export const getUserProjectRoadmap = async (req: Request, res: Response) => {
	Logger.info('Inside get user project road map controller')
	try {
		const { offset, limit, orderBy, orderType } = req.query
		const { projectId } = req.params
		const strOffset: string = offset ? offset.toString() : '0'
		const strLimit: string = limit ? limit.toString() : '10'
		const strorderBy: string = orderBy !== undefined ? orderBy?.toString()! : 'createdAt'
		const strorderType: string = orderType !== undefined ? orderType?.toString()! : 'DESC'
		const result = await getProjectAllRoadMapService(
			parseInt(projectId),
			parseInt(strOffset),
			parseInt(strLimit),
			strorderBy,
			strorderType
		)

		return responseHandler({ res, data: result, msg: messages.ALL_ROADMAPS_DATA_FETCHED_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, err: messages.INTERNAL_ERROR })
	}
}

export const returnFundsToInvestor = async (req: Request, res: Response) => {
	try {
		//@todo : Temperory controller will remove in future
		const { projectId } = req.params
		const responseData = await returnFundsToInvestorService(
			parseInt(projectId),
			req.headers.authorization!
		)
		return responseHandler({ res, msg: 'Yooooo', data: { responseData } })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, err: messages.INTERNAL_ERROR })
	}
}

export const deleteProjectDraft = async (req: Request, res: Response) => {
	Logger.info('Inside delete Project Draft Controller')
	try {
		const projectId = Number(req.params.projectId)

		const project = await getProjectService(
			{
				id: projectId,
			},
			{
				attributes: ['id', 'is_submitted'],
			}
		)
		if (!project) return errorHandler({ res, err: messages.PROJECT_NOT_FOUND })
		if (project?.is_submitted === true)
			return errorHandler({ res, err: messages.PROJECT_DELETE_FAILED })

		await deleteProjectDraftService(Number(projectId))
		return responseHandler({ res, msg: messages.PROJECT_DRAFT_DELETED })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const getProjectDevSummaryDashboardGraph = async (req: Request, res: Response) => {
	Logger.info('inside get ProjectDev Summary DashboardGraph Controller')
	try {
		const data = await getProjectDevSummaryDashboardGraphService(req.user.id)

		return responseHandler({
			res,
			data: {
				...data,
				summary: true,
			},
			msg: messages.GRAPH_DATA_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, data: { error } })
	}
}

export const getProjectPublic = async (req: Request, res: Response) => {
	Logger.info('Inside get Project Public Controller')
	try {
		const { projectId } = req.params

		const data = await getProjectService(
			{ id: projectId },
			{
				attributes: [
					'id',
					'title',
					'country',
					'vintage',
					'methodology',
					'standard',
					'key_activities',
					'expected_credit_date',
				],
			}
		)
		if (!data) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_NOT_FOUND,
			})
		}
		return responseHandler({ res, data, msg: messages.PROJECT_FETCHED_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, err: messages.INTERNAL_ERROR })
	}
}

export const getPojectVccPublicData = async (req: Request, res: Response) => {
	Logger.info('Inside Get Project VCC Data Controller')
	try {
		const { id, tokenId } = req.params
		const data = await getProjectVccPublicDataService(id, tokenId)
		if (!data) {
			return errorHandler({
				res,
				statusCode: 406,
				err: messages.PROJECT_NOT_FOUND,
			})
		}
		return responseHandler({ res, data, msg: messages.PROJECT_FETCHED_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, err: messages.INTERNAL_ERROR })
	}
}

export const updateVvbRegistryLogo = async (req: Request, res: Response) => {
	Logger.info('Inside update Vvb Logo Controller')
	try {
		const payload = req.body
		const validator = await updateVvbRegistryLogoValidator(payload)
		if (validator.error) {
			return errorHandler({ res, err: validator.message })
		}

		const { name, logo, option }: { name: string; logo: string; option: 'registry' | 'vvb_name' } =
			payload

		let updateData: {
			registryLogo?: string
			vvbLogo?: string
		} = {}

		if (option === 'registry') {
			updateData = {
				registryLogo: logo,
			}
		} else {
			updateData = {
				vvbLogo: logo,
			}
		}

		await updateVvbRegistryLogoService(updateData, { [option]: name })
		return responseHandler({ res, msg: messages.LOGO_UPDATE_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, err: messages.INTERNAL_ERROR })
	}
}

export const getAdminDashboardGraph = async (req: Request, res: Response) => {
	Logger.info('Inside get Investments')
	try {
		let year: number
		year = parseInt(req.query?.year?.toString()!)
		if (!year) year = new Date().getFullYear()
		const investmentsData = await getInvestmentsService(year)

		const xAxis: string[] = []
		const yAxis: number[] = []

		investmentsData.map((data) => {
			xAxis.push(data.month)
			yAxis.push(data.amountRaised)
		})

		return responseHandler({
			res,
			data: {
				xAxis,
				yAxis,
			},
			msg: messages.ADMIN_DASHBOARD_GRAPH_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, err: messages.INTERNAL_ERROR })
	}
}

export const getPlatformStats = async (req: Request, res: Response) => {
	Logger.info('Inside get PlatformStats')
	try {
		const { entity } = req.query
		const entityString = entity?.toString()

		if (
			!entityString ||
			!['overallStats', 'sevenDayStats', 'fourteenDayStats', 'thirtyDayStats'].includes(
				entityString
			)
		)
			return errorHandler({
				res,
				statusCode: 500,
				err: messages.INVALID_ENTITY,
			})

		const data = await getPlatformAnalyticsService(entityString)

		if (!data)
			return errorHandler({
				res,
				statusCode: 500,
				err: messages.INTERNAL_ERROR,
			})

		return responseHandler({
			res,
			data,
			msg: messages.PLATFORM_STATS,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, err: messages.INTERNAL_ERROR })
	}
}
export const changeProjectDisableStatus = async (req: Request, res: Response) => {
	Logger.info('Inside Change Project Disable Status Controller')
	try {
		const { projectId, isDisableData } = req.params
		let isDisable: boolean = isDisableData === 'true' ? true : false
		await changeProjectDisableStatusService(parseInt(projectId), isDisable)
		let message = isDisable ? messages.PROJECT_IS_DISABLED : messages.PROJECT_IS_ENABLED
		return responseHandler({ res, msg: message })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, err: messages.INTERNAL_ERROR })
	}
}

export const getPlatformStatsGraph = async (req: Request, res: Response) => {
	Logger.info('Inside get PlatformStats Graph')
	try {
		const { startDate, endDate, year } = req.query
		const startDateString = startDate?.toString()!
		const endDateString = endDate?.toString()!

		let data

		if (startDateString && endDateString) {
			data = await getPlatformStatsGraphService({
				date: {
					[Op.gte]: new Date(startDateString),
					[Op.lte]: new Date(endDateString),
				},
			})
		} else {
			data = await getPlatformStatsMonthlyGraphService(
				parseInt(year?.toString()! || `${new Date().getFullYear()}`)
			)
		}

		if (!data)
			return errorHandler({
				res,
				statusCode: 500,
				err: messages.INTERNAL_ERROR,
			})

		return responseHandler({
			res,
			data,
			msg: messages.PLATFORM_STATS_GRAPH,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, err: messages.INTERNAL_ERROR })
	}
}
export const enableNotifyMe = async (req: Request, res: Response) => {
	Logger.info('Inside enable notify me controller')
	try {
		const { projectId } = req.params
		const userId = req.user.id

		const notifyMeEnabled = await enableNotifyMeService(parseInt(projectId), userId)
		if (notifyMeEnabled === false) {
			return errorHandler({ res, statusCode: 409, err: messages.NOTIFYME_ALREADY_EXIST })
		}
		return responseHandler({
			res,
			status: 201,
			msg: messages.NOTIFYME_CREATE_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, err: messages.INTERNAL_ERROR })
	}
}

export const disableNotifyMe = async (req: Request, res: Response) => {
	Logger.info('Inside enable notify me controller')
	try {
		const { projectId } = req.params
		const userId = req.user.id

		const notifyMedisabled = await disableNotificationService(parseInt(projectId), userId)
		if (notifyMedisabled === false) {
			return errorHandler({ res, statusCode: 409, err: messages.NOTIFYME_DISABLE_FAILED })
		}

		return responseHandler({
			res,
			status: 201,
			msg: messages.NOTIFYME_DISABLE_SUCCESS,
		})
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, err: messages.INTERNAL_ERROR })
	}
}

export const userPortfolioData = async (req: Request, res: Response) => {
	Logger.info('inside user Portfolio data controller')
	try {
		const { type, activity, category, methodology, country } = req.query
		const str_type: string = type !== undefined ? type?.toString()! : ''
		const str_activity: string = activity !== undefined ? activity?.toString()! : ''
		const str_category: string = category !== undefined ? category?.toString()! : ''
		const str_methodology: string = methodology !== undefined ? methodology?.toString()! : ''
		const str_country: string = country !== undefined ? country?.toString()! : ''
		const { id } = req.user
		const result = await userPortfolioDataService(
			id,
			str_type,
			str_activity,
			str_category,
			str_methodology,
			str_country
		)
		return responseHandler({ res, data: result, msg: messages.PROJECT_FETCHED_SUCCESS })
	} catch (error) {
		Logger.error(error)
		errorHandler({ res, err: messages.INTERNAL_ERROR })
	}
}
