import _, { result } from 'lodash'
import axios from 'axios'
import { v4 as uuid } from 'uuid'
import { customAlphabet } from 'nanoid'
import { Logger } from '@config/logger'
import { MerkleTree } from 'merkletreejs'
import keccak256 from 'keccak256'
import Projects from '@projects/projects.model'
import { Op, QueryTypes, Sequelize } from 'sequelize'
import messages from '@helpers/messages'
import Config from '@config/config'
import {
	ProjectsInterface,
	ProjectTransactionInterface,
	TokenTransactionInterface,
	SeedVccCreditsInterface,
	VccTokenTransactionInterface,
	RoadmapInterface,
	YearlyProjectProjectionInterface,
	PlatformAnalyticsInterface,
	NotifyInterface,
} from '@interfaces/projects'
import { createSignUrl, downloadDoc } from '@helpers/helloSign'
import { AdminInterface, BankDetailsInterface } from '@interfaces/user'
import User from '@dummy/user/user.model'
import Withdraw from '@projects/withdraw.model'
import WithdrawInterface from '@interfaces/withdraw'
import ProjectTransaction from '@projects/projectTransaction.model'
import TokenTransactions from '@projects/tokenTransacions.model'
import SeedVccCredits from '@projects/seedVccCredits.model'
import YearlyProjectProjection from '@projects/yearlyProjectProjection.model'
import Merkle from '@projects/merkle.model'
import BlockchainBalance from '@projects/blockchainBalance.model'
import { BlockchainBalanceInterface } from '@interfaces/projects'
import moment from 'moment'
import BlockchainProof from '@projects/blockchainProof.model'
import VccTokenTransaction from '@projects/vccTokenTransaction.model'
import Countries from '@projects/countries.model'
import States from '@projects/states.model'
import Districts from '@projects/subDivision'
import { getUserData } from '@dummy/user/service'
import Roadmap from '@projects/roadmap.model'
import db from '@connections/db'
import Investments from '@projects/investements.model'
import PlatformAnalytics from '@projects/platformAnalytics.model'
import Notify from '@projects/notify.model'
import { getAuthToken } from '@helpers/authTokenHelper'
import {
	getCurrencyPotBalance,
	getAllCurrencyPotBalance,
	getMainPotBalance,
	transferBetweenPots,
	getCaxtonTransactionByccyCode,
	transferBetweenAccounts,
} from '@projects/caxtonService'
import {
	CurrencyPotBalanceInterface,
	GetAllCurrencyPotBalance,
	MainPotBalanceInterface,
} from '@interfaces/caxton'

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 5)

export const newProject = async (payload: Partial<ProjectsInterface>) => {
	Logger.info('Inside create project service')
	try {
		let requiredFields: any = Config.REQUIRED_FIELDS.PROJECT_CREATION

		payload = _.omitBy(payload, _.isUndefined)

		let requiredPayload: any = _.pick(payload, requiredFields)
		let requiredLength = Object.keys(requiredPayload).length
		payload.required_fields_entered = requiredLength

		let data: any = await (await Projects.create(payload)).toJSON()

		data = _.omitBy(data, _.isNull)

		if (!data) return { error: messages.PROJECT_CREATED_FAILED }

		return { projectDetails: data, projectId: data.id }
	} catch (error: any) {
		Logger.error(error)
		return { error: error.message }
	}
}

export const updateProject = async (
	projectId: number,
	payload: Partial<ProjectsInterface>,
	step: number
) => {
	Logger.info('Inside update project service')
	try {
		let requiredFields: any = Config.REQUIRED_FIELDS.PROJECT_CREATION
		if (payload.account_type) {
			if (payload.account_type === 'US') {
				requiredFields = _.pull(requiredFields, 'bank_name', 'bank_city', 'billing_address2')
			} else if (payload.account_type === 'IBAN') {
				requiredFields = _.pull(requiredFields, 'bank_name', 'billing_address2')
			} else if (payload.account_type === 'NON_IBAN') {
				requiredFields = _.pull(requiredFields, 'billing_address2')
			}
		}

		const data = await Projects.findOne({
			where: {
				id: projectId,
			},
			attributes: { exclude: ['userId', 'createdAt', 'updatedAt'] },
		}).then(async (result) => {
			return await result
				?.update(payload, {
					where: {
						id: projectId,
					},
					fields: [
						...requiredFields,
						'progress',
						'required_fields_entered',
						'bank_district',
						'bank_name',
						'bank_city',
						'billing_address2',
						'billing_district',
						'price_per_token',
						'platform_fees',
						'pre_verification_cost',
						'vvb_fees',
					],
				})
				.then(async (res) => {
					let requiredPayload: any = _.pick(_.omitBy(res?.get(), _.isNull), requiredFields)
					let requiredLength = Object.keys(requiredPayload).length

					res.required_fields_entered = requiredLength
					res.progress = Math.floor((requiredLength / Object.keys(requiredFields).length) * 100)
					return await res.save()
				})
		})
		return _.omitBy(data?.toJSON(), _.isNull)
	} catch (error) {
		Logger.error(error)
		return { error: Object }
	}
}

export const projectDetailsById = async (id: number) => {
	Logger.info('Inside project details by id')
	try {
		const details = await Projects.findByPk(id, {
			include: [{ model: User }],
		})

		if (!details) {
			return null
		}
		return { data: details }
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}

export const projectApproval = async (
	option:
		| 'submitProject'
		| 'approvedProject'
		| 'verifyProject'
		| 'adminReviewComplete'
		| 'rejectProject',
	payload: any
) => {
	Logger.info('Inside project approval service')
	try {
		switch (option) {
			case 'submitProject': {
				Logger.info('Inside project submitProject case in approval service')

				const { projectId, url, signatureId } = payload
				const projectDetails = await Projects.findByPk(parseInt(projectId))

				const { bank_account_verified, is_submitted, edit_request } = projectDetails!

				if (is_submitted && !edit_request) return { data: messages.PROJECT_ALREADY_SUBMITTED }

				if (bank_account_verified) {
					return { data: messages.PROJECT_SUBMIT_SUCCESS }
				}

				projectDetails!.signUrl = url
				projectDetails!.signatureId = signatureId

				await projectDetails?.save().catch((err) => Logger.error(err))
				return { data: projectDetails }
			}
			case 'verifyProject': {
				Logger.info('Inside Verify Project case in approval service')
				const { projectId, vvbId, vvbName, vvbInsight, authorization, vvbLogo } = payload
				const projectDetails = await Projects.findByPk(parseInt(projectId))
				if (!projectDetails || projectDetails?.is_rejected) {
					return null
				}
				projectDetails!.is_verified = true
				projectDetails!.vvb_id = vvbId
				projectDetails!.vvb_name = vvbName
				projectDetails!.vvb_insight = vvbInsight
				projectDetails!.vvb_send_date = new Date()
				projectDetails!.vvb_status = 'Pre Verification ongoing'
				projectDetails!.un_approve_project_status = 'success'
				projectDetails!.approved_at = moment().toDate()
				projectDetails!.vvbLogo = vvbLogo
				const walletData: any = await createProjectWallet(projectDetails.id, authorization)
				if (walletData !== false) {
					projectDetails.walletDescription = walletData.walletDescription
					projectDetails.walletId = walletData.walletId
					projectDetails.walletType = walletData.type
				}

				const potPrefix = nanoid()
				const BaseCcyCode = 'USD'
				projectDetails.potPrefix = potPrefix
				projectDetails.BaseCcyCode = BaseCcyCode
				projectDetails.CcyCode = `${potPrefix}-${BaseCcyCode}`

				await projectDetails?.save().catch((err) => Logger.error(err))
				return { data: projectDetails }
			}
			case 'adminReviewComplete': {
				Logger.info('Inside Admin Review Project case in approval service')
				const { projectId, typeOfReview } = payload
				const projectDetails = await Projects.findByPk(parseInt(projectId))
				if (!projectDetails || projectDetails?.is_rejected) {
					return null
				}
				switch (typeOfReview) {
					case 'saveAndExit': {
						Logger.info('Inside Save and Exit Project in approval service')
						projectDetails.project_size = payload.project_size
						projectDetails.short_description = payload.short_description
						projectDetails.video = payload.video
						projectDetails.man_power = payload.man_power
						projectDetails.farm_type = payload.farm_type
						projectDetails.approach = payload.approach
						projectDetails.key_activities = payload.key_activities
						projectDetails.sdg_commitments = payload.sdg_commitments
						projectDetails.impact_areas = payload.impact_areas
						projectDetails.area_offset_generation = payload.area_offset_generation
						projectDetails.min_annual_sequestration = payload.min_annual_sequestration
						projectDetails.max_annual_sequestration = payload.max_annual_sequestration
						projectDetails.per_year_annual_sequestration = payload.per_year_annual_sequestration
						projectDetails.total_credits_over_project = payload.total_credits_over_project
						projectDetails.certification_date = payload.certification_date
						projectDetails.additional_certification = payload.additional_certification
						projectDetails.registry_project_id = payload.registry_project_id
						projectDetails.large_description = payload.large_description
						projectDetails.year_of_projection = payload.year_of_projection
						projectDetails.projection = payload.projection
						projectDetails.additional_note = payload.additional_note
						projectDetails.exact_address = payload.exact_address
						projectDetails.totalNoOfInvestors = payload.totalNoOfInvestors
						projectDetails.platform_fees = payload.platform_fees
						projectDetails.pre_verification_cost = payload.pre_verification_cost
						projectDetails.vvb_fees = payload.vvb_fees
						projectDetails.price_per_token = payload.price_per_token
						await projectDetails?.save().catch((err) => {
							Logger.error(err)
						})
						return true
					}
					case 'preVerificationSuccess': {
						Logger.info('Inside Pre Verification Success service')
						const { authorization } = payload
						if (projectDetails!.un_approve_project_status !== 'success') {
							return false
						}
						projectDetails.pre_verification_report = payload.preVerificationDoc
						projectDetails.pre_verification_status = 'approved'
						projectDetails.vvb_status = 'Full Verification Ongoing'
						if (payload.live_seed_project) {
							projectDetails.hold_for_full_verification = false
							projectDetails.set_live_date = true
							projectDetails.project_seed_start_date = payload.project_seed_start_date
							projectDetails.project_seed_end_date = payload.project_seed_end_date
							const startDay = await checkDateWithTodayDate(payload.project_seed_start_date)
							const uri = `${Config.PUBLIC.GET_PUBLIC_PROJECT_DATA}/${parseInt(projectId)}`
							if (projectDetails.noOfGTPAvailable !== 0) {
								return 'AlreadyMinted'
							}
							const mintResponse = await mintGTPTokenService(
								projectDetails.userId,
								projectDetails.id.toString(),
								projectDetails.seed_credits,
								uri,
								authorization
							)
							if (!mintResponse) {
								return undefined
							}
							const blockPayload: ProjectTransactionInterface = {
								id: uuid(),
								transactionHash: mintResponse.data.data.response.result.transactionHash,
								projectId: projectDetails.id,
								amount: projectDetails.seed_credits,
								projectStartDate: projectDetails.project_seed_start_date,
								projectEndDate: projectDetails.project_seed_end_date,
								projectLength: projectDetails.length,
								uri,
								userId: projectDetails.userId,
							}
							await ProjectTransaction.create(blockPayload)
							Logger.info('Project Transaction created')
							projectDetails.noOfGTPAvailable = projectDetails.seed_credits
							projectDetails.noOfGTPSold = 0
							if (startDay) {
								projectDetails.live_seed_project = true
								projectDetails.project_status = 'Seed Live'
								projectDetails.seed_status = 'onGoing'
							} else {
								projectDetails.project_status = 'Ready to go Live'
							}
							await projectDetails?.save().catch((err) => {
								Logger.error(err)
							})
							return { status: true, data: blockPayload }
						} else {
							projectDetails.live_seed_project = false
							projectDetails.hold_for_full_verification = true
							projectDetails.vvb_status = 'Full Verification Ongoing'

							await projectDetails?.save().catch((err) => {
								Logger.error(err)
							})
							return { status: true }
						}
					}
					case 'fullVerificationSuccess': {
						Logger.info('Inside full Verification Success service')
						const { authorization } = payload
						if (projectDetails.pre_verification_status !== 'approved') {
							return false
						}
						projectDetails.full_verification_report = payload.fullVerificationDoc
						projectDetails.full_verification_status = 'approved'
						projectDetails.vvb_status = 'Verified'
						projectDetails.hold_for_full_verification = false
						projectDetails.fully_verified_at = moment().toDate()
						if (payload.live_seed_project) {
							projectDetails.set_live_date = true
							projectDetails.project_seed_start_date = payload.project_seed_start_date
							projectDetails.project_seed_end_date = payload.project_seed_end_date
							const startDay = await checkDateWithTodayDate(payload.project_seed_start_date)
							const uri = `${Config.PUBLIC.GET_PUBLIC_PROJECT_DATA}/${parseInt(projectId)}`
							if (projectDetails.noOfGTPAvailable !== 0) {
								return 'AlreadyMinted'
							}
							const mintResponse = await mintGTPTokenService(
								projectDetails.userId,
								projectDetails.id.toString(),
								projectDetails.seed_credits,
								uri,
								authorization
							)
							if (!mintResponse) {
								return undefined
							}
							const blockPayload: ProjectTransactionInterface = {
								id: uuid(),
								transactionHash: mintResponse.data.data.response.result.transactionHash,
								projectId: projectDetails.id,
								amount: projectDetails.seed_credits,
								projectStartDate: projectDetails.project_seed_start_date,
								projectEndDate: projectDetails.project_seed_end_date,
								projectLength: projectDetails.length,
								uri,
								userId: projectDetails.userId,
							}
							await ProjectTransaction.create(blockPayload)
							Logger.info('Project Transaction created')
							projectDetails.noOfGTPAvailable = projectDetails.seed_credits
							projectDetails.noOfGTPSold = 0
							if (startDay) {
								projectDetails.live_seed_project = true
								projectDetails.vvb_status = 'Verified'
								projectDetails.project_status = 'Seed Live'
								projectDetails.seed_status = 'onGoing'
							} else {
								projectDetails.project_status = 'Ready to go Live'
							}
							await projectDetails?.save().catch((err) => {
								Logger.error(err)
							})
							return { status: true, data: blockPayload }
						} else {
							projectDetails.live_seed_project = false
							projectDetails.vvb_status = 'Verified'
							if (projectDetails.project_status === 'Pending') {
								projectDetails.project_status = 'Ready to go Live'
							}
							await projectDetails?.save().catch((err) => {
								Logger.error(err)
							})
							return { status: true }
						}
					}
					case 'liveSeedProject': {
						Logger.info('Inside Live Seed Project service')
						const { authorization } = payload
						projectDetails.set_live_date = true
						projectDetails.project_seed_start_date = payload.project_seed_start_date
						projectDetails.project_seed_end_date = payload.project_seed_end_date
						const startDay = await checkDateWithTodayDate(payload.project_seed_start_date)
						const uri = `${Config.PUBLIC.GET_PUBLIC_PROJECT_DATA}/${parseInt(projectId)}`
						if (projectDetails.noOfGTPAvailable !== 0) {
							return 'AlreadyMinted'
						}
						const mintResponse = await mintGTPTokenService(
							projectDetails.userId,
							projectDetails.id.toString(),
							projectDetails.seed_credits,
							uri,
							authorization
						)
						if (!mintResponse) {
							return undefined
						}
						const blockPayload: ProjectTransactionInterface = {
							id: uuid(),
							transactionHash: mintResponse.data.data.response.result.transactionHash,
							projectId: projectDetails.id,
							amount: projectDetails.seed_credits,
							projectStartDate: projectDetails.project_seed_start_date,
							projectEndDate: projectDetails.project_seed_end_date,
							projectLength: projectDetails.length,
							uri,
							userId: projectDetails.userId,
						}
						await ProjectTransaction.create(blockPayload)
						Logger.info('Project Transaction created')
						projectDetails.noOfGTPAvailable = projectDetails.seed_credits
						projectDetails.noOfGTPSold = 0
						if (startDay) {
							projectDetails.live_seed_project = true
							projectDetails.project_status = 'Seed Live'
							projectDetails.seed_status = 'onGoing'
						}
						await projectDetails?.save().catch((err) => {
							Logger.error(err)
						})
						return { status: true, data: blockPayload }
					}
					default:
						break
				}
			}
			case 'rejectProject': {
				Logger.info('Inside Reject Project case in approval service')
				const { projectId, reason, rejectionType } = payload
				const { authorization } = payload
				const projectDetails = await Projects.findByPk(parseInt(projectId))
				if (!projectDetails || projectDetails?.is_rejected) {
					return null
				}
				projectDetails!.is_rejected = true
				projectDetails!.reject_reason = reason
				switch (rejectionType) {
					case 'unApproveProjectRejection': {
						Logger.info('Inside Un Approve Project Rejection service')
						if (payload.editRequest) {
							projectDetails.un_approve_project_status = 'editRequest'
							projectDetails.project_status = 'Edit Requested'
							projectDetails.vvb_status = 'Unverified'
							projectDetails.edit_request = true
						} else {
							projectDetails.un_approve_project_status = 'rejected'
							projectDetails.project_status = 'Rejected'
							projectDetails.vvb_status = 'Failed'
						}
						await projectDetails?.save().catch((err) => Logger.error(err))
						return true
					}
					case 'preVerificationRejection': {
						Logger.info('Inside Pre Verification Rejection service')
						projectDetails.pre_verification_status = 'rejected'
						projectDetails.project_status = 'Rejected'
						projectDetails.vvb_status = 'Failed'
						projectDetails.seed_status = 'failed'
						await projectDetails?.save().catch((err) => Logger.error(err))
						return true
					}
					case 'fullVerificationRejection': {
						Logger.info('Inside Full Verification Rejection service')
						projectDetails.full_verification_status = 'rejected'
						projectDetails.project_status = 'Rejected'
						projectDetails.vvb_status = 'Failed'
						projectDetails.seed_status = 'failed'
						if (projectDetails.live_seed_project) {
							const returnData = await returnFundsToInvestorService(
								projectDetails.id,
								authorization
							)
							if (!returnData) {
								return false
							}
						}
						await removeWithdrawRequestService(projectDetails.id)
						await projectDetails?.save().catch((err) => Logger.error(err))
						return true
					}
					default:
						break
				}
			}
			default:
				break
		}
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}

export const getAllProjectService = async (
	isVerified: boolean,
	registry: string,
	type: string,
	offset: number,
	limit: number,
	searchText: string,
	orderBy: string,
	orderType: string,
	stDate: string,
	enDate: string,
	unApprovedProjectStatus: string,
	preVerification: string,
	fullVerification: string,
	seedStatus: string,
	userId: string | undefined,
	strDate: string
) => {
	Logger.info('Inside Get All Project Service')
	try {
		let options: any = {
			offset,
			limit,
			where: {
				is_verified: isVerified,
				is_submitted: true,
			},
			order: [[orderBy, orderType]],
			include: [{ model: User }],
		}
		if (stDate !== '') {
			options.where.createdAt = {
				[Op.lte]: new Date(new Date(stDate).getTime() + 60 * 60 * 24 * 1000 - 1),
				[Op.gte]: new Date(stDate),
			}
		}
		if (strDate !== '') {
			options.where.createdAt = {
				[Op.lte]: new Date(new Date(enDate).getTime() + 60 * 60 * 24 * 1000 - 1),
				[Op.gte]: new Date(strDate),
			}
		}
		if (searchText !== '') {
			options.where.title = {
				[Op.iLike]: `%${searchText}%`,
			}
		}
		if (registry !== '') {
			options.where.registry = registry
		}
		if (type !== '') {
			options.where.type = type
		}
		if (unApprovedProjectStatus !== '') {
			options.where.un_approve_project_status = unApprovedProjectStatus
		}

		if (preVerification !== '') {
			options.where.pre_verification_status = preVerification
		}

		if (fullVerification !== '') {
			options.where.full_verification_status = fullVerification
		}
		if (seedStatus !== '') {
			switch (seedStatus) {
				case 'notStarted': {
					options.where.seed_status = 'not_started'
					break
				}
				case 'live': {
					options.where.seed_status = 'onGoing'
					break
				}
				case 'completed': {
					options.where.seed_status = 'completed'
					break
				}
				case 'creditRealized': {
					options.where.seed_status = 'realised'
					break
				}
				case 'failed': {
					options.where.seed_status = 'failed'
					break
				}
				default: {
					break
				}
			}
		}

		if (userId) options.where.userId = userId

		let listProject
		listProject = await Projects.findAndCountAll(options)
		return listProject
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}

export const sortArrayOfObj = (arr: any[], orderBy: string, strOrderType: string) => {
	Logger.info('inside sort array of object service')
	let data: any[]
	const orderType = strOrderType.toUpperCase()
	if (orderType === 'ASC') {
		data = arr.sort((a, b) => a[orderBy] - b[orderBy])
		return data
	}

	if (orderType === 'DESC') {
		data = arr.sort((a, b) => b[orderBy] - a[orderBy])
		return data
	}
}

export const getAllUserProjectService = async (
	offset: number,
	limit: number,
	orderBy: string,
	orderType: string,
	stDate: string,
	enDate: string,
	projectStatus: string,
	vvbStatus: string,
	id: string
) => {
	Logger.info('Inside Get All User Project Service')
	try {
		let options: any = {
			offset,
			limit,
			where: {
				userId: id,
				is_submitted: true,
			},
			attributes: [
				'title',
				'project_logo',
				'invest_amount',
				'project_status',
				'vvb_status',
				'vcc_issued',
				'raise_amount',
				'noOfGTPSold',
				'price_per_token',
				'id',
				'reject_reason',
				'project_seed_start_date',
				'project_seed_end_date',
				'total_vcc_issued',
			],
		}
		if (orderBy !== 'progress') {
			options.order = [[orderBy, orderType]]
		}
		if (stDate !== '') {
			options.where.createdAt = {
				[Op.lte]: new Date(new Date(enDate).getTime() + 60 * 60 * 24 * 1000 - 1),
				[Op.gte]: new Date(stDate),
			}
		}

		if (projectStatus !== '') {
			options.where.project_status = projectStatus
		}

		if (vvbStatus !== '') {
			options.where.vvb_status = vvbStatus
		}

		let listProject
		listProject = await Projects.findAndCountAll(options)
		const count = listProject.count
		let listMyProject: any[] = []

		listProject.rows.forEach((projectElement: any) => {
			const totalProgress = (
				((projectElement.dataValues.noOfGTPSold * projectElement.dataValues.price_per_token) /
					projectElement.dataValues.raise_amount) *
				100
			).toFixed(2)
			const projectData: any = {
				project: projectElement.dataValues,
				progress: parseFloat(totalProgress) <= 100 ? totalProgress : 100,
			}
			listMyProject.push(projectData)
		})
		if (orderBy === 'progress') {
			listMyProject = sortArrayOfObj(listMyProject, orderBy, orderType)!
		}
		return { count, rows: listMyProject }
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}

export const createBankAccount = async (payload: BankDetailsInterface, token: string) => {
	Logger.info('Inside create project bank account')
	try {
		const {
			account_number,
			routing_number,
			IBAN,
			account_id,
			status,
			description,
			tracking_ref,
			fingerprint,
			billing_name,
			billing_city,
			billing_country,
			billing_line1,
			billing_line2,
			billing_district,
			billing_postalCode,
			bank_name,
			bank_city,
			bank_country,
			bank_line1,
			bank_line2,
			bank_district,
			userId,
			type_of_account,
		} = payload
		const bankAccount = await axios
			.post(
				`${Config.SERVICES.USER}/user/createBankAccount`,
				{
					account_number,
					routing_number,
					IBAN,
					account_id,
					status,
					description,
					tracking_ref,
					fingerprint,
					billing_name,
					billing_city,
					billing_country,
					billing_line1,
					billing_line2,
					billing_district,
					billing_postalCode,
					bank_name,
					bank_city,
					bank_country,
					bank_line1,
					bank_line2,
					bank_district,
					userId,
					type_of_account,
				},
				{
					headers: {
						authorization: token,
					},
				}
			)
			.catch((error) => {
				Logger.error(`${Config.SERVICES.USER}/createAccount: Error`, error)
				return { error }
			})
		return { data: bankAccount }
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}

export const docSignService = async (payload: { email: string; name: string }) => {
	try {
		const data = await createSignUrl(payload)
		return data
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}

export const getDocService = async (id: number) => {
	try {
		Logger.info('inside get doc service')
		const project = await projectDetailsById(id)
		if (!project) {
			return false
		}
		const data = await downloadDoc(project.data?.signatureId!)
		if (!data) {
			return false
		}
		return data
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}

export const getUserDraftProjectsService = async (
	offset: number,
	limit: number,
	orderBy: string,
	orderType: string,
	id: string
) => {
	Logger.info('Inside Get Unpublished Project Service')
	try {
		let options: any = {
			offset,
			limit,
			where: {
				userId: id,
				is_submitted: false,
			},
			order: [[orderBy, orderType]],
			attributes: ['title', 'project_logo', 'createdAt', 'updatedAt', 'progress', 'id'],
		}

		const listProject = await Projects.findAndCountAll(options)
		if (!listProject) {
			return null
		}

		return listProject
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}
export const createProjectWallet = async (projectId: number, authorizationData: string) => {
	Logger.info('inside Create Wallet service')
	try {
		const projectDetails = await Projects.findByPk(projectId)
		const payload = {
			idempotencyKey: uuid(),
			description: projectDetails!.userId,
		}
		if (projectDetails!.walletId) {
			return false
		}
		const circleResponse: any = (await axios
			.post(`${Config.PAYMENT.CREATE_WALLET}`, payload, {
				headers: {
					authorization: authorizationData,
				},
			})
			.catch((err) => {
				Logger.error(err)
				return false
			}))!
		const response = {
			walletId: circleResponse!.data.data.data.walletId,
			type: circleResponse!.data.data.data.type,
			walletDescription: circleResponse!.data.data.data.description,
		}
		return response
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}

export const createBlockchainWallet = async (projectId: number, authorizationData: string) => {
	Logger.info('Inside Create Blockchain Wallet service')
	try {
		const projectDetails: any = await Projects.findByPk(projectId)
		if (projectDetails!.blockchainWalletId) {
			return false
		}
		const venlyobj = {
			pinCode: Math.floor(1000 + Math.random() * 9000).toString(),
			description: projectDetails.id,
			identifier: 'type=recoverable',
		}
		const venlyResponse: any = (await axios
			.post(`${Config.WEB3.CREATE_BLOCKCHAIN_WALLET}`, venlyobj, {
				headers: {
					authorization: authorizationData,
				},
			})
			.catch((err) => {
				Logger.error(err)
				return false
			}))!
		const response = {
			venlyPinCode: venlyobj.pinCode.toString(),
			blockchainWalletId: venlyResponse.data.data.result.id,
			blockchainWalletAddress: venlyResponse.data.data.result.address,
			blockchainWalletType: venlyResponse.data.data.result.walletType,
			blockchainSecretType: venlyResponse.data.data.result.secretType,
			blockchainWalletDescription: venlyResponse.data.data.result.description,
			blockchainWalletIdentifier: venlyResponse.data.data.result.identifier,
		}
		return response
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}

export const checkRequiredFields = async (payload: any) => {
	Logger.info('Inside checkRequiredFields service')
	try {
		const inter = _.intersection(
			Object.keys(_.omitBy(payload, _.isNull)),
			Config.REQUIRED_FIELDS.PROJECT_CREATION
		)

		const res = _.isEqual(inter, Config.REQUIRED_FIELDS.PROJECT_CREATION)
		if (!res) return false
		return true
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}

export const cronJobToStartLiveProject = async () => {
	try {
		Logger.info('Inside Cron job service')
		const thisDate = new Date()
		const projectList = await Projects.findAll({
			where: {
				is_verified: true,
				set_live_date: true,
				project_seed_start_date: {
					[Op.gte]: new Date(thisDate.setHours(thisDate.getHours() - 96)),
					[Op.lte]: new Date(thisDate.setHours(thisDate.getHours() + 192)),
				},
			},
		})

		projectList.forEach(async (element) => {
			const startDay = await checkDateWithTodayDate(element.project_seed_start_date)

			// send notification 3 days before live date
			const todayDay = new Date()
			const past3daysdateOflive = new Date(element.project_seed_start_date.getDate() - 3)
			const past3daysdateString = `${past3daysdateOflive.getFullYear()}-${past3daysdateOflive.getMonth()}-${past3daysdateOflive.getDate()}`
			const todayDayString = `${todayDay.getFullYear()}-${todayDay.getMonth()}-${todayDay.getDate()}`

			if (past3daysdateString === todayDayString) {
				await sendNotificationToProjectInv(
					element.id,
					'Project will live',
					`${element.title} will be active in the next 3 days. Review project`,
					true,
					true,
					`view-project/${element.id}`,
					'now',
					false
				)
			}

			if (startDay) {
				Logger.info(
					`Project :-"${element.id}" is going live at : ${element.project_seed_start_date}`
				)
				await Projects.update(
					{ live_seed_project: true, seed_status: 'onGoing', project_status: 'Seed Live' },
					{ where: { id: element.id } }
				)
			}
		})
		return true
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}

export const cronJobToEndLiveProject = async () => {
	try {
		Logger.info('Inside Cron job service')
		const thisDate = new Date()
		const projectList = await Projects.findAll({
			where: {
				is_verified: true,
				set_live_date: true,
				project_seed_end_date: {
					[Op.gte]: new Date(thisDate.setHours(thisDate.getHours() - 96)),
					[Op.lte]: new Date(thisDate.setHours(thisDate.getHours() + 192)),
				},
			},
		})

		projectList.forEach(async (element) => {
			const endDay = await checkDateWithTodayDate(element.project_seed_end_date)
			if (endDay) {
				Logger.info(
					`Project :-"${element.id}" is completed seed at : ${element.project_seed_end_date}`
				)
				const projectData: any = await Projects.findByPk(element.id, {
					include: [
						{
							model: User,
						},
					],
				})
				let authorizationData: string = ''
				const authObject = {
					id: projectData.userId,
					name: projectData.user.name,
					email: projectData.user.email,
					accountType: projectData.user.accountType,
					userType: projectData.user.userType,
				}
				const tokenResponse: any = (await axios
					.post(`${Config.AUTH.GENERATE_TOKEN}`, authObject)
					.catch((err) => {
						return false
					}))!
				const token: string = tokenResponse.data.data.token
				authorizationData = `Bearer ${token}`

				if (projectData?.data?.noOfGTPAvailable === 0) {
					await Projects.update(
						{
							live_seed_project: false,
							seed_status: 'completed',
							project_status: 'Seed Success',
							can_add_credits: true,
							canWithdraw: true,
						},
						{ where: { id: element.id } }
					)
					await axios
						.post(
							`${Config.NOTIFICATION.SEND}/${projectData.userId}`,
							{
								title: 'Seed Success',
								body: `Congratulation! ${projectData.title} seed is successful. Now you can withdraw the amount by submitting invoices to platform admin.`,
								topic: `user-${projectData.userId}`,
							},
							{
								headers: {
									authorization: authorizationData!,
								},
							}
						)
						.catch((err) => {
							Logger.error(err)
						})
					await sendNotificationToProjectInv(
						projectData.id,
						'Seed Success',
						`${projectData.title} seed is successfully completed. You can check your next steps`,
						false,
						true,
						'portfolio',
						'here',
						false,
						authorizationData!
					)
				} else {
					const returnData = await returnFundsToInvestorService(element.id, '')
					await Projects.update(
						{
							live_seed_project: false,
							seed_status: 'failed',
							project_status: 'Seed Failed',
							can_add_credits: false,
							canWithdraw: false,
						},
						{ where: { id: element.id } }
					)
					await removeWithdrawRequestService(element.id)
					await sendNotificationToProjectInv(
						projectData.id,
						'Seed Failed',
						`${projectData.title} seed has been Failed. The refund will be initiated soon.`,
						false
					)
					if (!returnData) {
						return false
					}
				}
			}
		})
		return true
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}

export const checkDateWithTodayDate = async (inputDate: Date) => {
	try {
		const todayDay = new Date()
		const todayDayString = `${todayDay.getFullYear()}-${todayDay.getMonth()}-${todayDay.getDate()}`
		const inputDateString = `${inputDate.getFullYear()}-${inputDate.getMonth()}-${inputDate.getDate()}`

		return todayDayString === inputDateString
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}

export const getUserPublishedProjectsService = async (id: string) => {
	Logger.info('Inside Get Published Project Service')
	try {
		const projectData = await Projects.findAll({
			where: { userId: id, is_submitted: true },
			attributes: [
				'title',
				'project_logo',
				'progress',
				'project_seed_start_date',
				'length',
				'seed_status',
				'seed_credits',
			],
		})
		if (!projectData) {
			return null
		}
		return projectData
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}

export const getAllProjectWalletService = async (
	offset: number,
	limit: number,
	searchText: string,
	status: string,
	countryData: string,
	stDate: string,
	enDate: string,
	authorizationData: string,
	date: string,
	orderBy: string,
	orderType: string
) => {
	Logger.info('Inside Get All Project Wallet Service')
	try {
		let options: any = {
			offset,
			limit,
			where: {
				is_submitted: true,
				is_verified: true,
			},
			include: [{ model: User, attributes: ['name', 'companyName'] }],
		}
		if (orderBy !== 'balance') {
			options.order = [[orderBy, orderType]]
		}

		if (date !== '') {
			options.where.last_withdraw_date = {
				[Op.lte]: new Date(new Date(date).getTime() + 60 * 60 * 24 * 1000 - 1),
				[Op.gte]: new Date(date),
			}
		}

		if (stDate !== '') {
			options.where.last_withdraw_date = {
				[Op.lte]: new Date(new Date(enDate).getTime() + 60 * 60 * 24 * 1000 - 1),
				[Op.gte]: new Date(stDate),
			}
		}
		if (searchText !== '') {
			options.where.title = {
				[Op.iLike]: `%${searchText}%`,
			}
		}
		if (status !== '') {
			options.where.project_status = status
		}
		if (countryData !== '') {
			options.where.country = {
				[Op.iLike]: `%${countryData}%`,
			}
		}
		let listProjectWallet: any[] = []
		const listProject = await Projects.findAndCountAll(options)
		let count

		//@note : Need to add Caxton tokens when it is implemented by FE
		if (Config.PAYMENT.CAXTON.CAXTON_ENABLE) {
			const superAdmin = await getSuperAdminService(authorizationData)
			if (!superAdmin) {
				return false
			}
			const payload: GetAllCurrencyPotBalance = {
				userEmail: superAdmin?.email!,
				password: superAdmin?.caxtonPassword!,
				userAPIToken: '',
				userTokenExpire: '',
				deviceId: '',
				device: '',
				operatingSystem: '',
			}
			const potArray = await getAllCurrencyPotBalance(payload, authorizationData)
			listProject.rows.forEach((projectElement: any) => {
				if (potArray) {
					potArray?.balanceArray.forEach((pot: any) => {
						if (
							projectElement.dataValues.CcyCode !== null &&
							projectElement.dataValues.CcyCode === pot.CcyCode
						) {
							const projectWalletData: any = {
								project: projectElement.dataValues,
								balance: pot.Balance,
							}
							listProjectWallet.push(projectWalletData)
						}
					})
				}
			})
		} else {
			const circleResponse: any = (await axios
				.get(`${Config.PAYMENT.GET_ALL_WALLETS}`, {
					headers: {
						authorization: authorizationData,
					},
				})
				.catch((err) => {
					return false
				}))!
			listProject.rows.forEach((projectElement: any) => {
				circleResponse.data.data.data.forEach((circleElement: any) => {
					if (
						projectElement.dataValues.walletId !== null &&
						projectElement.dataValues.walletId === circleElement.walletId
					) {
						const projectWalletData: any = {
							project: projectElement.dataValues,
							balance: circleElement.balances.length !== 0 ? circleElement.balances[0].amount : 0,
						}
						listProjectWallet.push(projectWalletData)
					}
				})
			})
		}
		count = listProjectWallet.length
		if (orderBy === 'balance') {
			listProjectWallet = sortArrayOfObj(listProjectWallet, orderBy, orderType)!
		}
		return { ...listProjectWallet, count }
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}

export const userDetailsById = async (id: string) => {
	Logger.info('Inside User details by id')
	try {
		const details = await User.findByPk(id)

		if (!details) {
			return null
		}
		return { data: details }
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}

export const createWithdrawRequestService = async (payload: WithdrawInterface) => {
	Logger.info('Inside create Withdraw Request service')
	try {
		const withdrawData = await Withdraw.create(payload)
		if (!withdrawData) {
			return null
		}
		return withdrawData
	} catch (error) {
		Logger.error(error)
	}
}

export const withdrawDetailsById = async (id: string) => {
	Logger.info('Inside Withdraw Details by id')
	try {
		const details = await Withdraw.findByPk(id)

		if (!details) {
			return null
		}
		return { data: details }
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}

export const getAllWithdrawRequestService = async (status: string, projectId: number) => {
	Logger.info('Inside Get All Withdraw Request service')
	try {
		const listWithdraw = await Withdraw.findAll({ where: { requestStatus: status, projectId } })
		return listWithdraw
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}

export const approveWithdrawDetailsService = async (withdrawId: string, amountReceived: number) => {
	Logger.info('Inside Approve Withdraw Details service')
	try {
		await Withdraw.update(
			{
				requestStatus: 'APPROVED',
				receivedDate: new Date(Date.now()),
				receivedAmount: amountReceived,
			},
			{ where: { id: withdrawId } }
		).catch((err) => {
			Logger.error(err)
			return false
		})
		return true
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}

export const updateProjectAfterWithdrawApproveService = async (
	projectId: number,
	amount: number
) => {
	Logger.info('Inside Update Project After Withdraw Approve service')
	try {
		const projectDetails = await Projects.findByPk(projectId)
		if (!projectDetails) {
			return false
		}
		const totalWithdrawAmount = projectDetails.withdraw_amount + amount
		const currentDate = new Date(Date.now())
		await Projects.update(
			{ withdraw_amount: totalWithdrawAmount, last_withdraw_date: currentDate },
			{ where: { id: projectId } }
		)
		return true
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}

export const rejectWithdrawDetailsService = async (
	withdrawId: string,
	rejectReason: string,
	rejectTitle: string
) => {
	Logger.info('Inside Reject Withdraw Details service')
	try {
		await Withdraw.update(
			{ requestStatus: 'REJECT', rejectReason, rejectTitle },
			{ where: { id: withdrawId } }
		).catch((err) => {
			Logger.error(err)
			return false
		})
		return true
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}

export const mintGTPTokenService = async (
	userId: string,
	projectId: string,
	amount: number,
	uri: string,
	authorizationData: string
) => {
	Logger.info('Inside Mint GTP Token service')
	try {
		const userData = await User.findByPk(userId)
		if (!userData?.blockchainWalletId) {
			return null
		}
		let adminError: boolean = false
		let adminErrorMessage: string = ''
		const superAdmin = (await axios
			.get(`${Config.ADMIN.GET_SUPER_ADMIN}`, {
				headers: {
					authorization: authorizationData!,
				},
			})
			.catch((err) => {
				Logger.error(err)
				adminError = true
				adminErrorMessage = err.response.data.msg
			}))!
		if (adminError) {
			return false
		}
		const venlyobj = {
			adminPincode: superAdmin.data.data.venlyPinCode,
			adminWalletId: superAdmin.data.data.blockchainWalletId,
			developerWalletAddress: userData.blockchainWalletAddress,
			amount,
			uri,
			unquieIdentifiers: projectId.toString(),
		}
		const venlyResponse: any = (await axios
			.post(`${Config.WEB3.MINT_GTP_META_TRANSACTION}`, venlyobj, {
				headers: {
					authorization: authorizationData,
				},
			})
			.catch((err) => {
				Logger.error(err)
				return false
			}))!

		return venlyResponse
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}

export const getProjectForInvestmentService = async (
	projectStatus: string,
	countryArray: string[],
	project_type: string,
	stDate: string,
	enDate: string,
	registry: string,
	length: string,
	userId: string
) => {
	Logger.info('Inside Get Project For Investment Service service')
	try {
		let options: any = {
			where: {
				set_live_date: true,
			},
		}
		if (countryArray.length !== 0) {
			options.where.country = {
				[Op.in]: countryArray,
			}
		}
		if (project_type !== '') {
			options.where.project_type = project_type
		}

		if (registry !== '') {
			switch (registry) {
				case 'verra': {
					options.where.registry = 'Verra'
					break
				}
				case 'goldStandard': {
					options.where.registry = 'Gold standard'
					break
				}
				default:
					break
			}
		}
		if (stDate !== '') {
			options.where.createdAt = {
				[Op.lte]: new Date(new Date(enDate).getTime() + 60 * 60 * 24 * 1000 - 1),
				[Op.gte]: new Date(stDate),
			}
		}
		if (length !== '0') {
			options.where.length = parseInt(length)
		}
		switch (projectStatus) {
			case 'ACTIVE': {
				options.where.seed_status = 'onGoing'
				break
			}
			case 'UPCOMING': {
				options.where.seed_status = 'not_started'
				break
			}
			case 'SOLD': {
				options.where.seed_status = {
					[Op.in]: ['completed', 'realised'],
				}
				break
			}
			default:
				break
		}
		if (projectStatus === 'UPCOMING') {
			options.include = {
				model: Notify,
			}
			const projectlist = await getUpcommingProjects(userId, options)
			return projectlist
		}
		const listProject = await Projects.findAndCountAll(options)
		return listProject
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}

export const updateProjectTransactionService = async (txHash: string, tokenId: string) => {
	Logger.info('Inside Update Project Transaction service')
	try {
		await ProjectTransaction.update({ tokenId }, { where: { transactionHash: txHash } })
		return true
	} catch (error) {
		Logger.error(error)
		return false
	}
}

export const getProjectTransactionService = async (
	filter: Partial<{
		projectId: number
		tokenId: string
	}>
) => {
	Logger.info('Inside Get Project Transaction service')
	try {
		const projectTransactionData = await ProjectTransaction.findOne({ where: filter })
		if (!projectTransactionData) {
			return false
		}
		return projectTransactionData
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}

export const createTokenTransactionService = async (payload: TokenTransactionInterface) => {
	Logger.info('Inside create Token Transaction service')
	try {
		const tokenTransactionData = await TokenTransactions.create(payload)
		if (!tokenTransactionData) {
			return null
		}
		return tokenTransactionData
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}

export const addSeedVccCreditsService = async (payload: SeedVccCreditsInterface) => {
	Logger.info('Inside addSeedVccCreditsService service')
	try {
		const data = await SeedVccCredits.create(payload)
		if (!data) return null

		return data
	} catch (error) {
		Logger.error(error)
		throw { error }
	}
}
export const editYearlyProjectionService = async (payload: {
	projectId: number
	projected_credits: number
	year: Date
	fullYear: number
	id?: string
}): Promise<any> => {
	try {
		const { projectId, year, fullYear } = payload
		const checkProjection = await YearlyProjectProjection.findOne({
			where: {
				projectId,
				fullYear,
			},
		})

		if (!checkProjection) {
			payload.id = uuid()
			const data = await YearlyProjectProjection.create(payload)
			return { data }
		}

		const data = await YearlyProjectProjection.update(payload, {
			where: { projectId, fullYear },
		})
		return { data }
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}

export const getYearlyProjectionService = async (
	projectId: number,
	offset: number,
	limit: number,
	orderBy: string,
	orderType: string
) => {
	try {
		const data = await YearlyProjectProjection.findAll({
			offset,
			limit,
			where: { projectId },
			order: [[orderBy, orderType]],
			include: [Projects],
		})
		if (!data) {
			return null
		}
		return { data, count: data.length }
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}

export const updateYearlyProjectionService = async (
	projectId: number,
	year: Date,
	payload: Partial<YearlyProjectProjectionInterface>
) => {
	Logger.info('inside update yearly projection service')
	try {
		const data = await YearlyProjectProjection.findOne({
			where: {
				projectId,
				fullYear: year.getFullYear(),
			},
		})
			.then((result) => {
				if (payload.sold) {
					payload.sold = result!.sold + payload.sold
				}
				if (payload.realised) {
					payload.realised = result!.realised + payload.realised
				}
				if (payload.credit_retired) {
					payload.credit_retired = result!.credit_retired + payload.credit_retired
				}
				if (payload.vcc_issued) {
					payload.vcc_issued = result!.vcc_issued + payload.vcc_issued
				}

				result?.update(payload, {
					where: {
						projectId,
						fullYear: year.getFullYear(),
					},
				})
				return true
			})
			.catch((err) => {
				return false
			})
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}

export const getMyportfolioDataService = async (userId: string, authorizationData: string) => {
	Logger.info('inside get my portfolio Data service ')
	try {
		let balance
		const userData: any = await getUserData({ id: userId })
		//@note : Need to add Caxton tokens when it is implemented by FE
		if (Config.PAYMENT.CAXTON.CAXTON_ENABLE) {
			const payload: MainPotBalanceInterface = {
				userEmail: userData.email,
				password: userData.caxtonPassword,
				userAPIToken: '',
				userTokenExpire: '',
				deviceId: '',
				device: '',
				operatingSystem: '',
				currency: 'USD',
			}
			const caxtonResponse = await getMainPotBalance(payload, authorizationData)
			if (!caxtonResponse) {
				return false
			}
			balance = caxtonResponse.Balance
		} else {
			const circleResponse: any = (await axios
				.get(`${Config.PAYMENT.GET_WALLET_DETAILS}`, {
					headers: {
						authorization: authorizationData,
					},
				})
				.catch((err) => {
					Logger.error(err)
					return false
				}))!
			if (!circleResponse) {
				return false
			}
			balance = circleResponse.data.data.data.balances[0].amount
		}
		const polkaDotDetails = (await axios
			.get(
				`${Config.COIN_GECKO.url}/coins/${Config.COIN_GECKO.COIN_ID}?${Config.COIN_GECKO.COIN_QUERY}`
			)
			.catch((err) => {
				Logger.error(err)
			}))!

		const polkaValue = polkaDotDetails.data.market_data.current_price.usd

		const total_credits = await BlockchainBalance.sum('noOfGTPToken', {
			where: { userId },
		})
		const VCCAvailable = await BlockchainBalance.sum('noOfVCCToken', {
			where: { userId },
		})
		const currentValue = total_credits * polkaValue + parseInt(balance)

		return {
			currentValue,
			totalProjectToken: total_credits,
			VCCAvailable,
		}
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const getMyportfolioService = async (
	userId: string,
	offset: number,
	limit: number,
	orderBy: string,
	orderType: string,
	status: string,
	stDate: string,
	enDate: string,
	search: string,
	type: string,
	activity: string,
	category: string,
	methodology: string,
	country: string,
	sortCreatedAt: string,
	sortTitle: string,
	sortQuantity: string,
	sortType: string,
	sortActivity: string,
	authorizationData?: string
) => {
	Logger.info('Inside get my portfolio service')
	try {
		let options: any = {
			offset,
			limit,
			where: {
				userId,
			},
			order: [],
			include: [],
		}

		if (sortTitle === '' && sortQuantity === '' && sortType === '' && sortActivity === '') {
			options.order = [['createdAt', 'DESC']]
		}

		let projectOptions: any = {
			model: Projects,
			as: 'project',
			attributes: [
				'title',
				'project_logo',
				'price_per_token',
				'id',
				'userId',
				'seed_status',
				'project_status',
				'type',
				'activity',
				'latitude',
				'longitude',
				'country',
				'state',
				'methodology',
				'activity',
				'type',
				'total_vcc_issued',
			],
			required: true,
			where: {
				is_submitted: true,
			},
			order: [],
		}

		if (search !== '') {
			projectOptions.where[Op.or] = {
				title: {
					[Op.iLike]: `%${search}%`,
				},
				activity: {
					[Op.iLike]: `%${search}%`,
				},
				type: {
					[Op.iLike]: `%${search}%`,
				},
			}
		}

		if (stDate !== '') {
			options.where.createdAt = {
				[Op.lte]: new Date(new Date(enDate).getTime() + 60 * 60 * 24 * 1000 - 1),
				[Op.gte]: new Date(stDate),
			}
		}
		if (type !== '') {
			projectOptions.where.type = type
		}
		if (activity !== '') {
			projectOptions.where.activity = activity
		}
		if (methodology !== '') {
			projectOptions.where.methodology = methodology
		}
		if (country !== '') {
			projectOptions.where.country = country
		}

		const total_credits = await BlockchainBalance.sum('noOfGTPToken', {
			where: { userId },
		})

		if (sortCreatedAt !== '') {
			options.order.push(['createdAt', sortCreatedAt])
		}
		if (sortTitle !== '') {
			options.order.push(['projectName', sortTitle])
		}
		if (sortQuantity !== '') {
			options.order.push(['noOfGTPToken', sortQuantity])
		}
		if (sortType) {
			projectOptions.order.push(['type', sortType])
		}
		if (sortActivity) {
			projectOptions.order.push(['activity', sortActivity])
		}

		options.include.push(projectOptions)
		let blockData = await BlockchainBalance.findAndCountAll(options)

		const listProjectData: {
			count: number
			rows: any[]
		} = {
			rows: [],
			count: blockData.count,
		}
		blockData.rows.forEach((ele: any) => {
			let data: any = {
				project: ele?.dataValues.project,
				allocation: (ele?.dataValues.noOfGTPToken! / total_credits) * 100,
				amount: ele?.dataValues.noOfGTPToken,
				createdAt: ele?.dataValues.createdAt,
				totalCredit: ele?.dataValues.noOfGTPToken + ele?.dataValues.noOfVCCToken,
			}

			listProjectData.rows.push(data)
		})

		return listProjectData
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}
export const transferAmountInCircleWalletService = async (transferObj: any, authoize: string) => {
	Logger.info('Inside Transfer Amount In Circle Wallet service')
	try {
		let circleError: boolean = false
		let errMessage: string = ''
		const circleResponse = (await axios
			.post(`${Config.PAYMENT.CREATE_TRANSFER}`, transferObj, {
				headers: {
					authorization: authoize!,
				},
			})
			.catch((err) => {
				Logger.error(err)
				circleError = true
				errMessage = err.response.data.msg
			}))!
		if (circleError) {
			return { statusCode: 500, err: errMessage }
		}
		return circleResponse
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}

export const createBlockchainBalanceService = async (payload: BlockchainBalanceInterface) => {
	Logger.info('Inside Create Blockchain Balance service')
	try {
		const data = await BlockchainBalance.create(payload)
		if (!data) {
			return false
		}
		return data
	} catch (error) {
		Logger.error(error)
		return false
	}
}

export const getBlockchainBalanceService = async (
	projectId: number,
	tokenId: string,
	userId: string
) => {
	Logger.info('Inside Get Blockchain Balance service')
	try {
		const blockData = await BlockchainBalance.findOne({ where: { projectId, tokenId, userId } })
		if (!blockData) {
			return false
		}
		return blockData
	} catch (error) {
		Logger.error(error)
		return false
	}
}

export const getBlockchainBalanceByUserIdService = async (projectId: number, userId: string) => {
	Logger.info('Inside Get Blockchain Balance By User Idservice')
	try {
		const blockData = await BlockchainBalance.findOne({ where: { projectId, userId } })
		if (!blockData) {
			return false
		}
		return blockData
	} catch (error) {
		Logger.error(error)
		return false
	}
}

export const updateGTPBlockchainBalanceService = async (
	projectId: number,
	tokenId: string,
	userId: string,
	noOfGTPToken: number
) => {
	Logger.info('Inside Update GTP Blockchain Balance service')
	try {
		const blockData = await BlockchainBalance.update(
			{ noOfGTPToken },
			{ where: { projectId, tokenId, userId } }
		)
		if (!blockData) {
			return false
		}
		return true
	} catch (error) {
		Logger.error(error)
		return false
	}
}

export const updateVCCBlockchainBalanceService = async (
	projectId: number,
	tokenId: string,
	userId: string,
	noOfVCCToken: number,
	noOfGTPToken: number,
	tokenArray: Array<string>
) => {
	Logger.info('Inside Update VCC Blockchain Balance service')
	try {
		const blockData = await BlockchainBalance.update(
			{ noOfVCCToken, noOfGTPToken, vccTokenId: tokenArray },
			{ where: { projectId, tokenId, userId } }
		)
		if (!blockData) {
			return false
		}
		return true
	} catch (error) {
		Logger.error(error)
		return false
	}
}

export const updateTransactionHashBlockchainBalanceService = async (
	projectId: number,
	tokenId: string,
	userId: string,
	transactionHash: string
) => {
	Logger.info('Inside Update Transaction Hash Blockchain Balance service')
	try {
		const blockData = await BlockchainBalance.update(
			{ transactionHash },
			{ where: { projectId, tokenId, userId } }
		)
		if (!blockData) {
			return false
		}
		return true
	} catch (error) {
		Logger.error(error)
		return false
	}
}

export const updateProjectGTPService = async (
	noOfGTPAvailable: number,
	noOfGTPSold: number,
	projectId: number
) => {
	Logger.info('Inside Update Project GTP service')
	try {
		const data = await Projects.update(
			{ noOfGTPAvailable, noOfGTPSold },
			{ where: { id: projectId }, returning: true }
		)
		if (!data) return null

		return data[1][0]
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const mintVCCService = async (
	superAdmin: any,
	projectId: string,
	tokenId: string,
	amount: number,
	uri: string,
	authorizationData: string
) => {
	Logger.info('Inside Mint VCC Token service')
	try {
		const vccObj = {
			adminPincode: superAdmin?.venlyPinCode,
			adminWalletId: superAdmin?.blockchainWalletId,
			tokenId,
			amount: amount,
			uri,
			unquieIdentifiers: projectId.toString(),
		}
		const venlyResponse: any = await axios
			.post(`${Config.WEB3.MINT_VCC_META_TRANSACTION}`, vccObj, {
				headers: {
					authorization: authorizationData,
				},
			})
			.catch((err) => {
				Logger.error(err)
				return false
			})
		return venlyResponse
	} catch (error) {
		Logger.error(error)
		return { error }
	}
}

export const updateProjectService = async (payload: Partial<ProjectsInterface>, filter: any) => {
	try {
		if (payload.vcc_issued !== undefined && payload.vcc_issued! > 0) {
			payload.is_vcc_issued = true
		}
		const data = await Projects.update(payload, {
			where: filter,
			returning: true,
		})
		if (!data) return null
		return data[1]
	} catch (err) {
		return err
	}
}

export const createVccTokenTransactionService = async (payload: VccTokenTransactionInterface) => {
	try {
		const vccData = await VccTokenTransaction.create(payload)
		if (!vccData) {
			return false
		}
		return true
	} catch (err) {
		Logger.error(err)
		return false
	}
}

export const updateVccTokenTransactionService = async (
	payload: Partial<VccTokenTransactionInterface>,
	filter: any
): Promise<any> => {
	try {
		const data = await VccTokenTransaction.update(payload, {
			where: filter,
			returning: true,
		})

		if (!data) return null
		return data[1]
	} catch (err) {
		return err
	}
}

export const getVccSeedCreditService = async (
	filter: any
): Promise<SeedVccCreditsInterface | any> => {
	try {
		return await SeedVccCredits.findOne({
			where: filter,
		})
	} catch (err) {
		return err
	}
}

export const updateVccSeedCreditService = async (
	payload: Partial<SeedVccCreditsInterface>,
	filter: any
): Promise<any> => {
	try {
		const data = await SeedVccCredits.update(payload, {
			where: filter,
			returning: true,
		})

		if (!data) return null
		return data[1]
	} catch (err) {
		return err
	}
}
export const merkleProofWhiteListingService = async () => {
	Logger.info('Inside Merkle Proof White Listing service')
	try {
		const merkleList = await Merkle.findAll()
		let addresses: Array<string> = []
		merkleList.forEach((element) => {
			const addressData: string = element.walletAddress
			addresses.push(addressData)
		})
		const leaves = addresses.map((x) => keccak256(x))
		const tree = new MerkleTree(leaves, keccak256, { sortPairs: true })
		const root = tree.getRoot().toString('hex')
		return true
	} catch (error) {
		Logger.error(error)
		return false
	}
}

export const getProjectsService = async (
	filter: any,
	options: {
		offset: number
		limit: number
		attributes?: string[]
		include?: any
		order?: string[][]
	},
	search?: string
) => {
	Logger.info('Inside Get All Project Service')
	try {
		if (options?.order && options?.order[0][0] === 'tokenId') {
			const orderType = options?.order[0][1]

			const data: Projects[] = await db.query(
				`(SELECT "title", public."Projects".id, public."ProjectTransaction"."tokenId" FROM public."Projects"
  join public."ProjectTransaction" on  public."Projects".id = public."ProjectTransaction"."projectId") order by  public."ProjectTransaction"."tokenId" ${orderType}  offset ${options.offset} limit ${options.limit} `,
				{
					type: QueryTypes.SELECT,
				}
			)

			const count = await Projects.count({
				where: {
					set_live_date: true,
				},
			})

			return {
				count,
				rows: data,
			}
		}

		let queryOptions: any = {
			where: filter,
			...options,
			raw: true,
		}
		if (search)
			queryOptions.where[Op.or] = {
				title: {
					[Op.iLike]: `%${search}%`,
				},
			}

		return await Projects.findAndCountAll(queryOptions)
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const getAllTranctonsService = async (
	userId: string,
	offset: number,
	limit: number,
	orderBy: string,
	orderType: string,
	event: string,
	stDate: string,
	enDate: string
) => {
	Logger.info('inside get all transations service')
	try {
		const options: any = {
			offset,
			limit,
			where: {
				userId,
			},
			order: [[orderBy, orderType]],
			attributes: [
				'id',
				'transactionHash',
				'projectId',
				'tokenQuantity',
				'fromWalletAddress',
				'toWalletAddress',
				'eventType',
				'userId',
				'createdAt',
			],
		}

		if (stDate !== '') {
			options.where.createdAt = {
				[Op.lte]: new Date(new Date(enDate).getTime() + 60 * 60 * 24 * 1000 - 1),
				[Op.gte]: new Date(stDate),
			}
		}
		if (event !== '') {
			options.where.eventType = event
		}

		const listTransactions = await TokenTransactions.findAndCountAll(options)

		return listTransactions
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const getTransactionService = async (id: string, userId: string) => {
	Logger.info('Inisde get transaction service')
	try {
		const result = await TokenTransactions.findOne({
			where: {
				userId,
				id,
			},
		})
		if (!result) {
			return null
		}
		return result
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const getAllBalanceService = async (
	userId: string,
	offset: number,
	limit: number,
	orderBy: string,
	orderType: string
) => {
	Logger.info('inside get all balance service')
	try {
		const options: any = {
			offset,
			limit,
			where: {
				userId,
				is_submitted: true,
			},
			order: [[orderBy, orderType]],
			attributes: ['title', 'project_logo', 'price_per_token', 'id', 'userId', 'country'],
		}

		let listProject
		listProject = await Projects.findAndCountAll(options)
		const blockchainBalance = await BlockchainBalance.findAndCountAll({ where: { userId } })
		let count = 0
		let listMyProject: any[] = []

		listProject.rows.forEach((projectElement: any) => {
			blockchainBalance.rows.forEach((blockchainBalanceElement: any) => {
				if (blockchainBalanceElement.dataValues.projectId === projectElement.dataValues.id) {
					const projectData: any = {
						project: projectElement.dataValues,
						tokenQuantity: blockchainBalanceElement?.noOfGTPToken,
						balanceId: blockchainBalanceElement?.id,
					}
					count += 1
					listMyProject.push(projectData)
				}
			})
		})

		return { count, rows: listMyProject }
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const getBalanceService = async (id: string, userId: string) => {
	Logger.info('inside get balance service')
	try {
		const balance = await BlockchainBalance.findOne({
			where: {
				id,
				userId,
			},
		})
		if (!balance) {
			return null
		}
		return balance
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const getInvestorTotalGTPAndVCCService = async (userId: string) => {
	Logger.info('inside get total GTP and VCC service')
	try {
		const data = await BlockchainBalance.findAll({
			where: {
				userId,
			},
			attributes: [
				[Sequelize.cast(Sequelize.fn('sum', Sequelize.col('noOfGTPToken')), 'int'), 'noOfGTPToken'],
				[Sequelize.cast(Sequelize.fn('sum', Sequelize.col('noOfVCCToken')), 'int'), 'noOfVCCToken'],
			],
		})
		return { totalGTP: data[0].noOfGTPToken ?? 0, totalVCC: data[0].noOfVCCToken ?? 0 }
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const getDeveloperTotalGTPAndVCCService = async (userId: string) => {
	Logger.info('inside get total GTP and VCC service')
	try {
		const data = await Projects.findAll({
			where: {
				userId,
			},
			attributes: [
				[Sequelize.cast(Sequelize.fn('sum', Sequelize.col('vcc_issued')), 'int'), 'vcc_issued'],
				[
					Sequelize.cast(Sequelize.fn('sum', Sequelize.col('noOfGTPAvailable')), 'int'),
					'noOfGTPAvailable',
				],
			],
		})
		return { totalGTP: data[0].noOfGTPAvailable ?? 0, totalVCC: data[0].vcc_issued ?? 0 }
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const getUserInvestedProjectsVccService = async (
	userId: string,
	offset: number,
	limit: number
) => {
	Logger.info('inside get User Invested Projects service')
	try {
		const transactionData = await BlockchainBalance.findAndCountAll({
			where: {
				userId,
			},
			offset,
			raw: true,
			limit,
			attributes: [['noOfVCCToken', 'vccOwned'], 'projectId'],
		})

		const projectIds = transactionData.rows.map((transaction) => transaction.projectId)
		const projectsData = await Projects.findAll({
			where: {
				id: {
					[Op.in]: projectIds,
				},
			},
			attributes: [
				'id',
				'un_approve_project_status',
				'pre_verification_status',
				'full_verification_status',
				'seed_status',
				'title',
				'vcc_issued',
			],
			raw: true,
		})

		const data: any = transactionData.rows.map((transaction: any) => {
			const project: any = projectsData.find((project) => project.id == transaction.projectId)
			return {
				...project,
				vccOwned: parseInt(transaction.vccOwned),
			}
		})

		return data
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const getAllVccTranctonsService = async (
	userId: string,
	offset: number,
	limit: number,
	orderBy: string,
	orderType: string,
	status: string,
	stDate: string,
	enDate: string
) => {
	Logger.info('inside get all transations service')
	try {
		const options: any = {
			offset,
			limit,
			where: {
				userId,
			},
			order: [[orderBy, orderType]],
		}

		if (stDate !== '') {
			options.where.createdAt = {
				[Op.lte]: new Date(new Date(enDate).getTime() + 60 * 60 * 24 * 1000 - 1),
				[Op.gte]: new Date(stDate),
			}
		}
		if (status !== '') {
			options.where.transactionStatus = status
		}
		const listTransactions = await VccTokenTransaction.findAndCountAll(options)

		return listTransactions
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const addCountriesDataService = async (data: any) => {
	Logger.info('inside add countries data service')
	try {
		const countryData = await Countries.bulkCreate(data)
		return countryData
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const getCountriesDataService = async (orderBy: string, orderType: string, circle: any) => {
	Logger.info('inside add countries data service')
	try {
		let options: any = {
			where: {},
			order: [[orderBy, orderType]],
		}
		if (circle !== '') {
			options.where.circle = circle
		}

		const countriesData = await Countries.findAll(options)
		return countriesData
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const getstateDataService = async (country: string) => {
	Logger.info('inside get state data service')
	try {
		const countryData = await Countries.findOne({
			where: {
				country,
			},
		})
		if (!countryData) {
			return null
		}

		const data = await States.findAll({
			where: { countryCode: countryData?.code },
		})
		return data
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const getDistrictDataService = async (country: string) => {
	Logger.info('inside get District Data service')
	try {
		const disdata = await Districts.findAll({
			where: {
				country,
			},
		})
		if (!disdata) {
			return null
		}
		return disdata
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const getcountryDataService = async (id: number) => {
	Logger.info('inside get country data service')
	try {
		const countryData = await Countries.findByPk(id)
		if (!countryData) {
			return null
		}
		return countryData
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const documentsignService = async (id: number, userId: string) => {
	Logger.info('inside document sign service')
	try {
		const projectData = await Projects.findOne({
			where: {
				id,
				userId,
			},
		})
			.then((result) => {
				result?.update(
					{
						docSigned: true,
						is_submitted: true,
						un_approve_project_status: 'pending',
						project_status: 'Pending',
						vvb_status: 'Unverified',
						edit_request: false,
						is_rejected: false,
					},
					{
						where: {
							id,
							userId,
						},
					}
				)
			})
			.catch((err) => {
				return null
			})
		return projectData
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const getProjectService = async (
	filter: any,
	options: {
		attributes?: string[]
		include?: any
	}
) => {
	Logger.info('Inside Get All Project Service')
	try {
		let queryOptions: any = {
			where: filter,
			...options,
			raw: true,
		}

		const data = await Projects.findOne(queryOptions)
		if (!data) return null
		return data
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const getProjectVccPublicDataService = async (id: string, tokenId: string) => {
	Logger.info('Inside Get Project VCC Public Data Service')
	try {
		const projectData: any = await Projects.findOne({
			where: { id: parseInt(id) },
			attributes: ['title', 'standard', 'registry'],
		})
		if (!projectData) {
			return false
		}
		const VCCData: any = await SeedVccCredits.findOne({
			where: { projectId: parseInt(id), projectTokenId: tokenId },
			attributes: ['serialNumber', 'additionalCertificates'],
		})
		if (!VCCData) {
			return false
		}
		const resBody = {
			projectName: projectData.title,
			serialNumber: VCCData.serialNumber,
			additionalCertificates: VCCData.additionalCertificates,
			standard: projectData.standard,
			registry: projectData.registry,
		}
		return resBody
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const getProjectDevDashboardGraphService = async (project: Projects) => {
	Logger.info('inside get ProjectDev Dashboard Graph Service')
	try {
		const { id, seed_credits } = project
		const totalTokensIssued = seed_credits
		const projectCreditsData = await YearlyProjectProjection.findAll({
			where: {
				projectId: id,
				fullYear: new Date().getFullYear(),
			},
			attributes: ['projected_credits', 'realised', 'sold'],
			raw: true,
		})

		const { projected_credits, realised, sold } = projectCreditsData[0]

		return {
			xAxis: totalTokensIssued,
			yAxis: {
				projected: projected_credits ?? 0,
				realised: realised ?? 0,
				sold: sold ?? 0,
			},
		}
	} catch (error) {
		Logger.error(error)
		throw error
	}
}
export const updateBlockchainBalance = async (
	projectId: number,
	tokenId: string,
	userId: string,
	projectName: string,
	amount: number,
	tokenArray: Array<string>
) => {
	Logger.info('inside Update BlockchainBalance service')
	try {
		const balanceData: any = await getBlockchainBalanceService(projectId, tokenId, userId)
		if (!balanceData) {
			const userData: any = await getUserData({ id: userId })
			const blockObj: BlockchainBalanceInterface = {
				id: uuid(),
				tokenId,
				projectId,
				projectName,
				userId,
				userName: userData.companyName,
				noOfVCCToken: amount,
				vccTokenId: tokenArray,
			}
			const blockchainBalance = await createBlockchainBalanceService(blockObj)
			if (!blockchainBalance) {
				return false
			}
		} else {
			let blockchainBalanceVCCArray: Array<string> = []
			if (balanceData.vccTokenId !== null) {
				blockchainBalanceVCCArray = balanceData.vccTokenId
			}
			tokenArray.forEach((ele) => {
				blockchainBalanceVCCArray.push(ele)
			})
			const noOfVCCToken = balanceData.noOfVCCToken + amount
			const noOfGTPToken = balanceData.noOfGTPToken - amount
			await updateVCCBlockchainBalanceService(
				projectId,
				tokenId,
				userId,
				noOfVCCToken,
				noOfGTPToken,
				blockchainBalanceVCCArray
			)
		}
		return true
	} catch (error) {
		Logger.error(error)
		return false
	}
}

export const getProjectDevProjectsService = async (
	offset: number,
	limit: number,
	orderBy: string,
	orderType: string,
	id: string
) => {
	Logger.info('insife get project dev projects service')
	try {
		let options: any = {
			offset,
			limit,
			where: {
				userId: id,
				is_submitted: true,
			},
			order: [[orderBy, orderType]],
			attributes: [
				'title',
				'project_logo',
				'invest_amount',
				'project_status',
				'raise_amount',
				'id',
				'country',
				'live_seed_project',
				'is_verified',
				'pre_verification_status',
				'full_verification_status',
				'noOfGTPSold',
				'price_per_token',
			],
		}

		let listProject
		listProject = await Projects.findAndCountAll(options)
		const count = listProject.count
		let listMyProject: any[] = []

		listProject.rows.forEach((projectElement: any) => {
			if (projectElement.live_seed_project) {
				const totalProgress = (
					((projectElement.dataValues.noOfGTPSold * projectElement.dataValues.price_per_token) /
						projectElement.dataValues.raise_amount) *
					100
				).toFixed(2)
				const projectData: any = {
					project: projectElement.dataValues,
					progress: parseFloat(totalProgress) <= 100 ? totalProgress : 100,
				}
				listMyProject.push(projectData)
			} else {
				let allocation = 0
				if (projectElement.is_verified) {
					allocation = 33
				}
				if (projectElement.pre_verification_status === 'approved') {
					allocation = 66
				}
				if (projectElement.full_verification_status === 'approved') {
					allocation = 100
				}
				const projectData: any = {
					project: projectElement.dataValues,
					allocation,
				}
				listMyProject.push(projectData)
			}
		})

		return { count, rows: listMyProject }
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const getAllInvestedProjectsService = async (
	offset: number,
	limit: number,
	orderBy: string,
	orderType: string,
	id: string
) => {
	Logger.info('inside get User Invested Projects service')
	try {
		const transactionData = await BlockchainBalance.findAndCountAll({
			where: {
				userId: id,
			},
			offset,
			raw: true,
			limit,
			attributes: ['projectId', 'createdAt', 'noOfGTPToken'],
		})

		const projectIds = transactionData.rows.map((transaction) => transaction.projectId)

		let listProject: any = []
		let count = 0
		const projectsData = await Projects.findAndCountAll({
			where: {
				id: {
					[Op.in]: projectIds,
				},
			},
			order: [[orderBy, orderType]],
			attributes: ['id', 'price_per_token', 'title', 'country', 'project_logo'],
			raw: true,
		})

		projectsData.rows.forEach((projectElement: any) => {
			transactionData.rows.forEach((tokenTransactionElement: any) => {
				if (tokenTransactionElement.projectId === projectElement.id) {
					const projectData: any = {
						project: projectElement,
						price: tokenTransactionElement?.noOfGTPToken * projectElement.price_per_token,
						tokenQuantity: tokenTransactionElement?.noOfGTPToken,
						createdAt: tokenTransactionElement.createdAt,
					}
					count += 1
					listProject.push(projectData)
				}
			})
		})
		if (orderBy === 'createdAt' || orderBy === 'price' || orderBy === 'tokenQuantity') {
			listProject = sortArrayOfObj(listProject, orderBy, orderType)
		}
		return { count, rows: listProject }
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const getInvestorDashboardGraphService = async (userId: string, project?: Projects) => {
	Logger.info('inside get Investor Dashboard Graph Service')
	try {
		const queryOptions: any = {
			where: {
				userId,
			},
			raw: true,
		}

		let queryAttributes = []

		let realized = 0

		if (project) {
			queryOptions.where.projectId = project.id
			queryAttributes.push('projectId', 'noOfGTPToken', 'noOfVCCToken')
			realized = project.total_vcc_issued
		} else {
			queryAttributes.push(
				[Sequelize.cast(Sequelize.fn('sum', Sequelize.col('noOfGTPToken')), 'int'), 'noOfGTPToken'],
				[Sequelize.cast(Sequelize.fn('sum', Sequelize.col('noOfVCCToken')), 'int'), 'noOfVCCToken']
			)

			const project = await Projects.findAll({
				attributes: [
					[
						Sequelize.cast(Sequelize.fn('sum', Sequelize.col('total_vcc_issued')), 'int'),
						'total_vcc_issued',
					],
				],
				where: {
					seed_status: 'realised',
				},
			})

			realized = project[0].total_vcc_issued ?? 0
		}

		const tokensData = await BlockchainBalance.findAll({
			...queryOptions,
			attributes: queryAttributes,
		})

		if (tokensData.length === 0)
			return {
				xAxis: 0,
				yAxis: {
					bought: 0,
					retire: 0,
					sold: 0,
					realized: 0,
				},
			}

		const vccOwned = tokensData[0].noOfVCCToken ?? 0
		const gtpOwned = tokensData[0].noOfGTPToken ?? 0
		const totalTokensOwned = vccOwned + gtpOwned

		return {
			xAxis: totalTokensOwned,
			yAxis: {
				bought: gtpOwned,
				retire: vccOwned,
				sold: 0,
				realized,
			},
		}
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const getRetiredCreditsService = async (userId: string) => {
	Logger.info('inside get Retired Credits service')
	try {
		const blockchainBalanceData = await BlockchainBalance.findAll({
			where: {
				userId,
			},
			raw: true,
			attributes: [
				[Sequelize.cast(Sequelize.fn('sum', Sequelize.col('noOfVCCToken')), 'int'), 'vccTokens'],
				[Sequelize.cast(Sequelize.fn('sum', Sequelize.col('noOfGTPToken')), 'int'), 'gtpTokens'],
				'projectId',
			],
			group: ['projectId'],
		})

		if (blockchainBalanceData.length === 0) return { creditsRetired: 0, creditsAvailable: 0 }

		let totalVcc = 0
		let totalGtp = 0

		const projectIds: number[] = blockchainBalanceData.map((blockchainBalance: any) => {
			totalVcc += blockchainBalance.vccTokens
			totalGtp += blockchainBalance.gtpTokens
			return blockchainBalance?.projectId
		})

		const projectsData = await Projects.findAll({
			where: {
				id: {
					[Op.in]: projectIds,
				},
			},
			attributes: [
				[Sequelize.cast(Sequelize.fn('sum', Sequelize.col('vcc_issued')), 'int'), 'vcc_issued'],
			],
			raw: true,
		})
		const creditsAvailable = Math.min(totalGtp, projectsData[0].vcc_issued)

		return { creditsRetired: totalVcc, creditsAvailable }
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const getTotalRetiredCreditsService = async () => {
	Logger.info('inside get Total Retired Credits service')
	try {
		const totalVccRetired = await VccTokenTransaction.findAll({
			raw: true,
			attributes: [
				[Sequelize.cast(Sequelize.fn('sum', Sequelize.col('vccQuantity')), 'int'), 'vccQuantity'],
			],
		})
		const totalCarbonSupply = await Projects.sum('total_vcc_issued')
		if (totalVccRetired.length === 0)
			return {
				totalCreditsRetired: 0,
			}

		return { totalCreditsRetired: totalVccRetired[0].vccQuantity, totalCarbonSupply }
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const getInvestorDetailsService = async (
	offset: number,
	limit: number,
	orderBy: string,
	orderType: string,
	projectId: number
) => {
	Logger.info('inside Get Investor Details service')
	try {
		const projectDevId = await Projects.findByPk(projectId, {
			attributes: ['userId'],
		})
		let options: any = {
			offset,
			limit,
			where: {
				projectId,
			},
			order: [[orderBy, orderType]],
			attributes: ['noOfGTPToken', 'userName'],
			raw: true,
		}
		options.where.userId = {
			[Op.notLike]: `%${projectDevId!.userId}%`,
		}
		const investorDetails = await BlockchainBalance.findAndCountAll(options)
		return investorDetails
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const getCreditRealisedService = async (
	offset: number,
	limit: number,
	orderBy: string,
	orderType: string,
	projectId: number
) => {
	Logger.info('inside Get Credit Realised service')
	try {
		let options: any = {
			offset,
			limit,
			where: {
				projectId,
			},
			order: [[orderBy, orderType]],
			attributes: ['transactionHash', 'quantityIssued', 'createdAt'],
			raw: true,
		}
		const creditRealised = await SeedVccCredits.findAndCountAll(options)
		return creditRealised
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const getRetireHistoryService = async (
	userId: string,
	offset: number,
	limit: number,
	orderBy: string,
	orderType: string,
	country: string,
	project_type: string,
	activity: string,
	methodology: string,
	strDate: string,
	enDate: string,
	search: string,
	sortCreatedAt: string,
	sortTitle: string,
	sortQuantity: string,
	sortType: string,
	sortActivity: string
) => {
	Logger.info('inside get retire history service')
	try {
		let options: any = {
			offset,
			limit,
			attributes: [
				'id',
				'transactionHash',
				'projectId',
				'userId',
				'createdAt',
				'projectTitle',
				'projectMethodology',
				'vccQuantity',
				'retireBy',
				'vccTokenId',
			],
			where: {},
			include: [],
			order: [],
		}
		let order = []
		let projectOrder = []
		let projectOptions: any = {}
		if (search !== '') {
			projectOptions = {
				model: Projects,
				attributes: ['type', 'project_logo', 'activity', 'country', 'methodology'],
				required: true,
				where: {
					is_submitted: true,
					[Op.or]: {
						title: {
							[Op.iLike]: `%${search}%`,
						},
						activity: {
							[Op.iLike]: `%${search}%`,
						},
						type: {
							[Op.iLike]: `%${search}%`,
						},
					},
				},
				order: [],
			}
		} else {
			projectOptions = {
				model: Projects,
				attributes: ['type', 'project_logo', 'activity', 'country', 'methodology'],
				required: true,
				where: {
					is_submitted: true,
				},
				order: [],
			}
		}

		if (sortCreatedAt !== '') {
			order.push(['createdAt', sortCreatedAt])
		}
		if (sortTitle !== '') {
			order.push(['projectTitle', sortTitle])
		}
		if (sortQuantity !== '') {
			order.push(['vccQuantity', sortQuantity])
		}
		if (sortType) {
			projectOrder.push(['type', sortType])
		}
		if (sortActivity) {
			projectOrder.push(['activity', sortActivity])
		}
		projectOptions.order = projectOrder
		options.order = order

		if (country !== '') {
			projectOptions.where.country = country
		}
		if (project_type !== '') {
			projectOptions.where.type = project_type
		}
		if (methodology !== '') {
			options.where.projectMethodology = methodology
			projectOptions.where.methodology = methodology
		}
		if (activity !== '') {
			projectOptions.where.activity = activity
		}
		if (strDate !== '') {
			options.where.createdAt = {
				[Op.lte]: new Date(new Date(enDate).getTime() + 60 * 60 * 24 * 1000 - 1),
				[Op.gte]: new Date(strDate),
			}
		}

		options.include.push(projectOptions)

		const historyData = await VccTokenTransaction.findAndCountAll(options)

		return historyData
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const createRoadmapForProjectService = async (projectId: number) => {
	Logger.info('inside Create Roadmap For Project service')
	try {
		const varificationArray = [
			'Planning',
			'Planning',
			'Planning',
			'Pipeline',
			'Pipeline',
			'Pipeline',
			'Pipeline',
			'Realized',
			'Rating',
			'Rating',
		]
		const subVerificationArray = [
			'Project Idea Note (PIN)',
			'Project Feasibility Study (PFS)',
			'Project Design Document (PDD)',
			'Registration',
			'Validation',
			'Verification',
			'Monitoring',
			'Monitoring +',
			'Issuance Rating',
			'Project Rating',
		]
		for (let i = 0; i < 10; i++) {
			let payload: RoadmapInterface = {
				id: uuid(),
				projectId,
				verification: varificationArray[i],
				subVerification: subVerificationArray[i],
				status: false,
			}
			const roadmapData = await Roadmap.create(payload)
			if (!roadmapData) {
				return false
			}
		}
		return true
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const updateRoadmapValidationStatusService = async (payload: any) => {
	Logger.info('inside Update Roadmap Validation Status service')
	try {
		let status = false
		let verificationDate = null
		if (payload.status) {
			status = true
		}
		if (payload.status) {
			verificationDate = payload.verificationDate
		}
		await Roadmap.update(
			{ status, dateOfVerification: verificationDate },
			{ where: { id: payload.roadmapId } }
		).catch((err) => {
			Logger.error(err)
			return false
		})
		return true
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const updateRoadmapValidationService = async (payload: any) => {
	Logger.info('inside Update Roadmap Validation service')
	try {
		await Roadmap.update(
			{ verification: payload.verification, subVerification: payload.subVerification },
			{ where: { id: payload.roadmapId } }
		).catch((err) => {
			Logger.error(err)
			return false
		})
		return true
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const createRoadmapService = async (payload: any) => {
	Logger.info('inside Create Roadmap service')
	try {
		const roadmapDetails: RoadmapInterface = {
			id: uuid(),
			projectId: payload.projectId,
			verification: payload.verification,
			subVerification: payload.subVerification,
			status: false,
		}
		const roadmapData = await Roadmap.create(roadmapDetails)
		if (!roadmapData) {
			return false
		}
		return true
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const deleteRoadmapValidationService = async (roadmapId: string) => {
	Logger.info('inside Delete Roadmap Validation service')
	try {
		await Roadmap.destroy({ where: { id: roadmapId } })
		return true
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const getAvailableCreditsToRetireService = async (userId: string, project: Projects) => {
	Logger.info('inside get Available Credits To Retire Service')
	try {
		const blockchainBalanceData = await BlockchainBalance.findAll({
			where: {
				userId,
				projectId: project.id,
			},
			raw: true,
			attributes: [
				[Sequelize.cast(Sequelize.fn('sum', Sequelize.col('noOfGTPToken')), 'int'), 'noOfGTPToken'],
			],
		})

		if (blockchainBalanceData.length === 0) return { availableCreditsToRetire: 0 }

		const gtpTokens = blockchainBalanceData[0].noOfGTPToken || 0

		const creditsAvailable = Math.min(gtpTokens, project.vcc_issued)

		return { availableCreditsToRetire: creditsAvailable }
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const getAllRoadMapService = async (
	projectId: number,
	offset: number,
	limit: number,
	orderBy: string,
	orderType: string
) => {
	Logger.info('inside get all road map service')
	try {
		let options: any = {
			offset,
			limit,
			where: {
				projectId,
			},
			order: [[orderBy, orderType]],
		}
		let allRoadmaps = await Roadmap.findAndCountAll(options)
		let popValue: any = {}
		const newRoadMap: { count: number; rows: any[] } = {
			count: allRoadmaps.count,
			rows: [],
		}
		allRoadmaps.rows.forEach((ele, index) => {
			if (ele.subVerification === 'Validation' && ele.verification === 'Pipeline') {
				popValue.data = ele
			} else {
				if (ele.subVerification === 'Verification' && ele.verification === 'Pipeline') {
					popValue.index = index
				}
				newRoadMap.rows.push(ele)
			}
		})

		newRoadMap.rows.splice(popValue.index, 0, popValue.data)
		return newRoadMap
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const listProjectsToRetireGTPService = async (userId: string) => {
	Logger.info('inside list Projects To Retire GTP Service')
	try {
		return await BlockchainBalance.findAll({
			where: {
				userId,
			},
			raw: true,
			attributes: [
				['projectId', 'id'],
				['projectName', 'name'],
			],
			group: ['projectId', 'projectName'],
		})
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const getRoadmapService = async (id: string) => {
	Logger.info('inside get road map service')
	try {
		const roadMap = await Roadmap.findOne({
			where: {
				id,
			},
		})
		if (!roadMap) {
			return null
		}
		return roadMap
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const getProjectAllRoadMapService = async (
	projectId: number,
	offset: number,
	limit: number,
	orderBy: string,
	orderType: string
) => {
	Logger.info('inside get Project all road map service')
	try {
		let options: any = {
			offset,
			limit,
			where: {
				projectId,
			},
			order: [[orderBy, orderType]],
		}
		const allRoadmaps = await Roadmap.findAll(options)

		let listRoadMap: any[] = []
		let subPlanningData: any[] = []
		let subPipelineData: any[] = []
		let subRealizedData: any[] = []
		let subRatingData: any[] = []
		allRoadmaps.forEach((ele) => {
			switch (ele.verification) {
				case 'Planning': {
					const subData = {
						name: ele.subVerification,
						status: ele.status,
					}
					subPlanningData.push(subData)
					break
				}
				case 'Pipeline': {
					if (ele.subVerification === 'Verification') {
						const subData = {
							name: ele.subVerification,
							status: ele.status,
						}
						subPipelineData.splice(1, 0, subData)
						break
					} else {
						const subData = {
							name: ele.subVerification,
							status: ele.status,
						}

						subPipelineData.push(subData)
						break
					}
				}
				case 'Realised': {
					const subData = {
						name: ele.subVerification,
						status: ele.status,
					}
					subRealizedData.push(subData)
					break
				}
				case 'Rating': {
					const subData = {
						name: ele.subVerification,
						status: ele.status,
					}
					subRatingData.push(subData)
					break
				}
			}
		})
		const planningData: any = {
			verification: 'Planning',
			subVerification: subPlanningData,
		}
		if (subPlanningData.length > 0) {
			listRoadMap.push(planningData)
		}
		const pipelineData: any = {
			verification: 'Pipeline',
			subVerification: subPipelineData,
		}
		if (subPipelineData.length > 0) {
			listRoadMap.push(pipelineData)
		}
		const realizedData: any = {
			verification: 'Realized',
			subVerification: subRealizedData,
		}
		if (subRealizedData.length > 0) {
			listRoadMap.push(realizedData)
		}
		const ratingData: any = {
			verification: 'Rating',
			subVerification: subRatingData,
		}
		if (subRatingData.length > 0) {
			listRoadMap.push(ratingData)
		}
		return listRoadMap
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const getProjectDetailsService = async (
	id: number,
	userId: string,
	authorizationData: string
) => {
	Logger.info('inside get Project Details Service')
	try {
		const details = await Projects.findOne({
			where: { id },
			attributes: [
				'id',
				'title',
				'country',
				'state',
				'vintage',
				'latitude',
				'longitude',
				'registry',
				'standard',
				'type',
				'methodology',
				'scale',
				'project_details_doc',
				'project_images',
				'other_docs',
				'project_logo',
				'seed_credits',
				'expected_credit_date',
				'raise_amount',
				'price_per_token',
				'userId',
				'project_account_id',
				'is_submitted',
				'bank_account_verified',
				'is_verified',
				'progress',
				'required_fields_entered',
				'activity',
				'length',
				'is_rejected',
				'reject_reason',
				'edit_request',
				'un_approve_project_status',
				'pre_verification_status',
				'full_verification_status',
				'seed_status',
				'signatureId',
				'signUrl',
				'docSigned',
				'short_description',
				'video',
				'project_size',
				'man_power',
				'farm_type',
				'approach',
				'key_activities',
				'sdg_commitments',
				'impact_areas',
				'area_offset_generation',
				'min_annual_sequestration',
				'max_annual_sequestration',
				'per_year_annual_sequestration',
				'total_credits_over_project',
				'certification_date',
				'additional_certification',
				'registry_project_id',
				'large_description',
				'pre_verification_report',
				'year_of_projection',
				'projection',
				'additional_note',
				'live_seed_project',
				'hold_for_full_verification',
				'project_seed_start_date',
				'project_seed_end_date',
				'set_live_date',
				'full_verification_report',
				'additional_documents',
				'approve_project',
				'withdraw_amount',
				'last_withdraw_date',
				'project_status',
				'vvb_status',
				'invest_amount',
				'vcc_issued',
				'tx_hash',
				'uri',
				'blockchain_token_id',
				'pre_verification_cost',
				'vvb_fees',
				'platform_fees',
				'total_project_raise_amount',
				'submitted_at',
				'approved_at',
				'walletId',
				'fully_verified_at',
				'first_credits_issued_at',
				'can_add_credits',
				'noOfGTPAvailable',
				'noOfGTPSold',
				'totalNoOfInvestors',
				'currentNoOfInvestors',
				'canWithdraw',
				'is_vcc_issued',
				'is_fees_paid',
				'total_vcc_issued',
				'project_type',
				'project_sub_type',
				'BaseCcyCode',
				'potPrefix',
			],
			include: [
				{
					model: User,
				},
			],
		})
		if (!details) {
			return null
		}
		let creditPurchased = 0
		if (details?.userId !== userId) {
			const userData: any = await User.findByPk(userId)
			if (!userData) {
				return false
			}
			creditPurchased = await TokenTransactions.sum('tokenQuantity', {
				where: {
					projectId: id,
					toWalletAddress: userData.blockchainWalletAddress,
				},
			})
			if (creditPurchased === null) {
				creditPurchased = 0
			}
		}
		//@note : Need to add Caxton tokens when it is implemented by FE
		let escrowBalance = 0
		if (Config.PAYMENT.CAXTON.CAXTON_ENABLE) {
			const superAdmin = await getSuperAdminService(authorizationData)
			if (!superAdmin) {
				return false
			}
			const payload: CurrencyPotBalanceInterface = {
				userEmail: superAdmin?.email!,
				password: superAdmin?.caxtonPassword!,
				userAPIToken: '',
				userTokenExpire: '',
				deviceId: '',
				device: '',
				operatingSystem: '',
				currency: details?.BaseCcyCode,
				potPrefix: details?.potPrefix,
			}
			const caxtonResponse = await getCurrencyPotBalance(payload, authorizationData)
			if (caxtonResponse) {
				escrowBalance = caxtonResponse.Balance
			}
		} else {
			if (details?.walletId) {
				const circleResponse: any = (await axios
					.get(`${Config.PAYMENT.GET_BALANCE}/${details?.walletId}`, {
						headers: {
							authorization: authorizationData,
						},
					})
					.catch((err) => {
						Logger.error(err)
						return false
					}))!
				escrowBalance =
					circleResponse.data.data.data.balances.length !== 0
						? circleResponse.data.data.data.balances[0].amount
						: 0
			}
		}
		return { data: details, creditPurchased, escrowBalance }
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const getProjectDetailsForAdminService = async (id: number, userId: string) => {
	Logger.info('inside get Project Details For User Service')
	try {
		const details = await Projects.findByPk(id, {
			include: [{ model: User }],
		})
		if (!details) {
			return null
		}
		return { data: details }
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const getProjectsTokenIdService = async (projects: Projects[]) => {
	Logger.info('Inside get Projects TokenId Service')
	try {
		const projectIds = projects.map((project) => project.id)

		return await ProjectTransaction.findAll({
			where: {
				projectId: {
					[Op.in]: projectIds,
				},
			},
			attributes: ['tokenId', 'projectId'],
			raw: true,
		})
	} catch (error) {
		Logger.error(error)
		throw error
	}
}
export const returnFundsToInvestorService = async (
	projectId: number,
	authorizationData: string
) => {
	//@note : Need to add Caxton tokens when it is implemented by FE
	Logger.info('inside Return Funds To Inversor Service')
	try {
		const projectDetails: any = await Projects.findByPk(projectId, {
			include: [{ model: User }],
		})
		if (!projectDetails) {
			return false
		}
		if (authorizationData === '' || authorizationData === undefined) {
			const authObject = {
				id: projectDetails.userId,
				name: projectDetails.user.name,
				email: projectDetails.user.email,
				accountType: projectDetails.user.accountType,
				userType: projectDetails.user.userType,
			}
			const tokenResponse: any = (await axios
				.post(`${Config.AUTH.GENERATE_TOKEN}`, authObject)
				.catch((err) => {
					return false
				}))!
			const token: string = tokenResponse.data.data.token
			authorizationData = `Bearer ${token}`
		}
		let adminError: boolean = false
		let adminErrorMessage: string = ''
		const superAdmin = (await axios
			.get(`${Config.ADMIN.GET_SUPER_ADMIN}`, {
				headers: {
					authorization: authorizationData,
				},
			})
			.catch((err) => {
				Logger.error(err)
				adminError = true
				adminErrorMessage = err.response.data.msg
			}))!
		if (adminError) {
			return false
		}
		if (projectDetails.seed_status === 'onGoing') {
			const totalFees =
				parseInt(projectDetails?.total_project_raise_amount) -
				parseInt(projectDetails?.raise_amount)
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
						fromCurrencyPot: projectDetails?.CcyCode!,
						toCurrencyPot: feesPotCcyCode,
						amount: totalFees,
						deviceId: '',
						device: '',
						operatingSystem: '',
						projectId: parseInt(projectDetails?.id),
						projectTitle: projectDetails?.title!,
					},
					authorizationData
				)

				if (!potTransferRes.status) return false
			} else {
				const transferObj = {
					sourceWalletId: projectDetails?.walletId,
					sourceType: 'wallet',
					destinationWalletId: superAdmin.data.data.walletId,
					destinationType: 'wallet',
					amount: totalFees.toString(),
					currency: 'USD',
					userId: superAdmin.data.data.id.toString(),
				}
				const authoize = authorizationData
				const superAdminWalletTrasfer: any = await transferAmountInCircleWalletService(
					transferObj,
					authoize
				)
				if (superAdminWalletTrasfer.statusCode === 500) {
					return false
				}
			}
		}
		let escrowBalance = 0
		let listOfTransaction
		let escrowData: number
		let userData: any
		if (Config.PAYMENT.CAXTON.CAXTON_ENABLE) {
			const transaction = await getCaxtonTransactionByccyCode(
				authorizationData,
				projectDetails?.CcyCode
			)
			if (!transaction) {
				return false
			}
			listOfTransaction = transaction
			const payload: CurrencyPotBalanceInterface = {
				potPrefix: projectDetails?.potPrefix,
				userEmail: superAdmin.data.data.email,
				password: superAdmin.data.data.caxtonPassword!,
				userAPIToken: '',
				userTokenExpire: '',
				deviceId: '',
				device: '',
				operatingSystem: '',
				currency: projectDetails?.BaseCcyCode,
			}
			const caxtonResponse = await getCurrencyPotBalance(payload, authorizationData)
			if (!caxtonResponse) {
				return false
			} else {
				escrowBalance = caxtonResponse.Balance
			}
			escrowData = escrowBalance
			listOfTransaction.forEach(async (ele: any) => {
				const invester_percent =
					(parseInt(ele.amount) * 100) / parseInt(projectDetails?.total_project_raise_amount)

				let refund_amount = (invester_percent / 100) * escrowBalance

				if (escrowData - refund_amount <= 0) {
					refund_amount = escrowData
				}
				if (parseFloat(refund_amount.toFixed(2)) > 0) {
					//@note : Need to add Caxton tokens when it is implemented by FE
					const accTransferRes = await transferBetweenAccounts(
						{
							userEmail: superAdmin.data.data.email,
							password: superAdmin.data.data.caxtonPassword,
							userAPIToken: '',
							userTokenExpire: '',
							caxtonUserId: ele.source_user_id,
							sendCurrency: projectDetails?.CcyCode,
							amount: parseFloat(refund_amount.toFixed(2)),
							deviceId: '',
							device: '',
							operatingSystem: '',
							projectId: parseInt(projectDetails?.id),
							projectTitle: projectDetails?.title!,
						},
						authorizationData
					)

					if (!accTransferRes.status) return false

					userData = await getUserData({ id: ele.userId })
					//@note : Need to add Caxton tokens when it is implemented by FE
					const potTransferRes = await transferBetweenPots(
						{
							userEmail: userData.email,
							password: userData.caxtonPassword,
							userAPIToken: '',
							userTokenExpire: '',
							fromCurrencyPot: projectDetails?.CcyCode,
							toCurrencyPot: projectDetails?.BaseCcyCode,
							amount: parseFloat(refund_amount.toFixed(2)),
							deviceId: '',
							device: '',
							operatingSystem: '',
							projectId: parseInt(projectDetails?.id),
							projectTitle: projectDetails?.title!,
						},
						authorizationData
					)

					if (!potTransferRes.status) return false
					escrowData = escrowData - parseFloat(refund_amount.toFixed(2))
				}
			})
		} else {
			const circleResponse: any = (await axios
				.get(`${Config.PAYMENT.GET_TRANSACTION_BY_WALLET_ID}/${projectDetails?.walletId}`, {
					headers: {
						authorization: authorizationData,
					},
				})
				.catch((err) => {
					return false
				}))!
			listOfTransaction = circleResponse.data.data
			const walletData: any = (await axios
				.get(`${Config.PAYMENT.GET_BALANCE}/${projectDetails?.walletId}`, {
					headers: {
						authorization: authorizationData,
					},
				})
				.catch((err) => {
					Logger.error(err)
					return false
				}))!
			escrowBalance =
				walletData.data.data.data.balances.length !== 0
					? walletData.data.data.data.balances[0].amount
					: 0
			escrowData = escrowBalance
			listOfTransaction.forEach(async (ele: any) => {
				if (ele.tokenTransferedStatus === 'completed') {
					const invester_percent =
						(parseInt(ele.amount) * 100) / parseInt(projectDetails?.total_project_raise_amount)

					let refund_amount = (invester_percent / 100) * escrowBalance

					if (escrowData - refund_amount <= 0) {
						refund_amount = escrowData
					}
					if (parseFloat(refund_amount.toFixed(2)) > 0) {
						let transferObj = {
							sourceWalletId: ele.destination_wallet_id,
							sourceType: 'wallet',
							destinationWalletId: ele.source_wallet_id,
							destinationType: 'wallet',
							amount: refund_amount.toFixed(2).toString(),
							currency: 'USD',
							userId: ele.userId,
						}
						const projectWalletTransfer: any = await transferAmountInCircleWalletService(
							transferObj,
							authorizationData
						)
						if (projectWalletTransfer.statusCode === 500) {
							return false
						}
						escrowData = escrowData - parseFloat(refund_amount.toFixed(2))
					}
				}
			})
		}
		return true
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const removeWithdrawRequestService = async (projectId: number) => {
	Logger.info('inside Remove Withdraw Request Service')
	try {
		const withdrawData = await Withdraw.findAll({ where: { projectId } })
		if (withdrawData) {
			withdrawData.forEach(async (ele) => {
				await Withdraw.destroy({ where: { projectId: ele.projectId } })
			})
		}
		return true
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const deleteProjectDraftService = async (projectId: number) => {
	Logger.info('inside delete ProjectDraft Service')
	try {
		return await Projects.destroy({
			where: {
				id: projectId,
				is_submitted: false,
			},
		})
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const getProjectDevSummaryDashboardGraphService = async (userId: string) => {
	Logger.info('inside get ProjectDev Summary Dashboard Graph Service')
	try {
		const projects = await Projects.findAll({
			where: {
				userId,
				project_status: {
					[Op.in]: ['Seed Live', 'Seed Success', 'Seed Failed', 'Credit Realised'],
				},
			},
			raw: true,
			attributes: ['id', 'seed_credits'],
		})

		let seed_credits: number = 0

		const projectIds = projects.map((project) => {
			seed_credits += Number(project.seed_credits)
			return project.id
		})

		const totalTokensIssued = seed_credits
		const projectCreditsData = await YearlyProjectProjection.findAll({
			where: {
				projectId: {
					[Op.in]: projectIds,
				},
				fullYear: new Date().getFullYear(),
			},
			attributes: [
				[
					Sequelize.cast(Sequelize.fn('sum', Sequelize.col('projected_credits')), 'int'),
					'projected_credits',
				],
				[Sequelize.cast(Sequelize.fn('sum', Sequelize.col('realised')), 'int'), 'realised'],
				[Sequelize.cast(Sequelize.fn('sum', Sequelize.col('sold')), 'int'), 'sold'],
			],
			raw: true,
		})

		const { projected_credits, realised, sold } = projectCreditsData[0]

		return {
			xAxis: totalTokensIssued,
			yAxis: {
				projected: projected_credits ?? 0,
				realised: realised ?? 0,
				sold: sold ?? 0,
			},
		}
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const getCircleWalletBalanceService = async (walletId: string, authorization: string) => {
	try {
		const circleResponse: any = (await axios
			.get(`${Config.PAYMENT.GET_BALANCE}/${walletId}`, {
				headers: {
					authorization,
				},
			})
			.catch((err) => {
				Logger.error(err)
				return false
			}))!
		const escrowBalance =
			circleResponse.data.data.data.balances.length !== 0
				? circleResponse.data.data.data.balances[0].amount
				: 0

		return escrowBalance
	} catch (err) {
		Logger.error(err)
		return err
	}
}

export const getProjectPotBalanceService = async (
	potPrefix: string,
	currency: string,
	authorization: string
) => {
	//@note : Need to add Caxton tokens when it is implemented by FE
	Logger.info('inside Get Project Pot Balance Service')
	try {
		const adminData = await getSuperAdminService(authorization)
		if (!adminData) {
			return false
		}
		const payload: CurrencyPotBalanceInterface = {
			potPrefix,
			userEmail: adminData.email,
			password: adminData.caxtonPassword!,
			userAPIToken: '',
			userTokenExpire: '',
			deviceId: '',
			device: '',
			operatingSystem: '',
			currency,
		}
		const balance = await getCurrencyPotBalance(payload, authorization)
		if (!balance) {
			return false
		}
		return balance.Balance
	} catch (err) {
		Logger.error(err)
		throw err
	}
}

export const updateVvbRegistryLogoService = async (
	payload: Partial<ProjectsInterface>,
	filter: any
) => {
	try {
		Logger.info('inside update Vvb Registry Logo Service')
		await Projects.update(payload, {
			where: filter,
		})
		return true
	} catch (err) {
		return err
	}
}

export const changeProjectDisableStatusService = async (projectId: number, isDisable: boolean) => {
	try {
		Logger.info('inside Change Project Disable Status Service')
		await Projects.update(
			{ isDisabled: isDisable },
			{
				where: { id: projectId },
			}
		)
		return true
	} catch (err) {
		return err
	}
}

export const sendNotificationToProjectInv = async (
	projectId: number,
	title: string,
	body: string,
	nofifyMe: boolean,
	hasLink?: boolean,
	link?: string,
	linkMsg?: string,
	isInvested?: boolean,
	authorizationData?: string
) => {
	Logger.info('Inside send notification to project investor service')
	try {
		const projectDetails: any = await Projects.findByPk(projectId, {
			include: [{ model: User }],
		})
		if (!projectDetails) {
			return false
		}
		if (authorizationData === '' || authorizationData === undefined) {
			const authObject = {
				id: projectDetails.userId,
				name: projectDetails.user.name,
				email: projectDetails.user.email,
				accountType: projectDetails.user.accountType,
				userType: projectDetails.user.userType,
			}
			const tokenResponse: any = (await axios
				.post(`${Config.AUTH.GENERATE_TOKEN}`, authObject)
				.catch((err) => {
					return false
				}))!
			const token: string = tokenResponse.data.data.token
			authorizationData = `Bearer ${token}`
		}

		if (nofifyMe) {
			let userIds: any = []

			if (isInvested) {
				userIds = await getNotifyMeEnabledUserIds({ projectId, isInvested })
			} else {
				userIds = await getNotifyMeEnabledUserIds({ projectId })
			}
			if (userIds === null) {
				return false
			}
			userIds.forEach(async (userId: any) => {
				await axios
					.post(
						`${Config.NOTIFICATION.SEND}/${userId}`,
						{
							title,
							body,
							topic: `user-${userId}`,
							hasLink,
							link,
							linkMsg,
						},
						{
							headers: {
								authorization: authorizationData!,
							},
						}
					)
					.catch((err) => {
						Logger.error(err)
					})
			})
			return true
		}
		let options: any = {
			where: {
				projectId,
			},
			attributes: ['noOfGTPToken', 'userName', 'userId'],
			raw: true,
		}
		options.where.userId = {
			[Op.notLike]: `%${projectDetails!.userId}%`,
		}
		const investorDetails = await BlockchainBalance.findAndCountAll(options)

		investorDetails.rows.forEach(async (ele) => {
			await axios
				.post(
					`${Config.NOTIFICATION.SEND}/${ele.userId}`,
					{
						title,
						body,
						topic: `user-${ele.userId}`,
						hasLink,
						link,
						linkMsg,
					},
					{
						headers: {
							authorization: authorizationData!,
						},
					}
				)
				.catch((err) => {
					Logger.error(err)
				})
		})

		return true
	} catch (error) {
		Logger.error(error)
		return false
	}
}
export const saveMonthlyInvestements = async () => {
	Logger.info('inside saveMonthlyInvestements')
	try {
		const thisDate = new Date()
		const year = thisDate.getFullYear()
		const month = thisDate.toLocaleString('default', { month: 'long' })

		const projects: any = await Projects.findAll({
			raw: true,
			attributes: [[Sequelize.literal('SUM("noOfGTPSold"*"price_per_token")'), 'amountRaised']],
		})
		if (projects.length === 0) return
		const totalAmountRaised = projects[0].amountRaised

		const totalInvestement = await Investments.findAll({
			raw: true,
			attributes: [
				[Sequelize.cast(Sequelize.fn('sum', Sequelize.col('amountRaised')), 'int'), 'amountRaised'],
			],
		})
		if (totalInvestement.length === 0)
			return await Investments.create({
				id: uuid(),
				amountRaised: totalAmountRaised,
				year,
				month,
			})

		const totalAmount = totalInvestement[0].amountRaised

		const thisMonthinvestment = await Investments.findOne({
			where: {
				year,
				month,
			},
			raw: true,
		})

		if (thisMonthinvestment) {
			await Investments.update(
				{
					amountRaised: totalAmountRaised - totalAmount + thisMonthinvestment.amountRaised,
				},
				{
					where: {
						id: thisMonthinvestment.id,
					},
				}
			)
		} else {
			await Investments.create({
				id: uuid(),
				amountRaised: totalAmountRaised - totalAmount,
				year,
				month,
			})
		}
	} catch (error) {
		Logger.error(error)
	}
}

export const getInvestmentsService = async (year: number) => {
	try {
		Logger.info('inside get Investments Service')
		return await Investments.findAll({
			where: {
				year,
			},
			attributes: ['month', 'amountRaised'],
			order: [['createdAt', 'ASC']],
			raw: true,
		})
	} catch (err) {
		Logger.error(err)
		throw err
	}
}

export const getPlatformStatsService = async () => {
	try {
		Logger.info('inside get PlatformStats Service')

		const projectsData: any = await Projects.findAll({
			raw: true,
			attributes: [
				[Sequelize.cast(Sequelize.fn('sum', Sequelize.col('noOfGTPSold')), 'int'), 'noOfGTPSold'],
				[
					Sequelize.cast(Sequelize.fn('sum', Sequelize.col('currentNoOfInvestors')), 'int'),
					'totalNoOfInvestors',
				],
				[Sequelize.literal('SUM("noOfGTPSold"*"price_per_token")'), 'totalAmountRaised'],
				[
					Sequelize.cast(Sequelize.fn('sum', Sequelize.col('total_project_raise_amount')), 'int'),
					'amountToBeReaised',
				],
				[Sequelize.cast(Sequelize.fn('sum', Sequelize.col('seed_credits')), 'int'), 'totalGTP'],
			],
		})

		const {
			noOfGTPSold,
			totalNoOfInvestors,
			totalAmountRaised,
			amountToBeReaised,
			totalGTP,
		}: {
			noOfGTPSold: number
			totalNoOfInvestors: number
			totalAmountRaised: number
			amountToBeReaised: number
			totalGTP: number
		} = projectsData[0]

		return {
			noOfGTPSold,
			totalNoOfInvestors,
			totalAmountRaised,
			amountToBeReaised,
			totalGTP,
		}
	} catch (err) {
		Logger.error(err)
		throw err
	}
}

export const savePlatformAnalytics = async () => {
	Logger.info('inside platformAnalytics')
	try {
		const { totalCreditsRetired: creditsRetired } = await getTotalRetiredCreditsService()
		const {
			noOfGTPSold,
			totalNoOfInvestors: noOfInvestors,
			totalAmountRaised: amountRaised,
			amountToBeReaised,
			totalGTP,
		} = await getPlatformStatsService()

		const currentDate = new Date()
		const currentMonth = currentDate.toLocaleString('default', { month: 'long' })

		const defaultPayload = {
			creditsRetired,
			noOfGTPSold,
			amountRaised,
			noOfInvestors,
			date: currentDate,
			month: currentMonth,
			amountToBeReaised,
			totalGTP,
		}

		const overallStats = await PlatformAnalytics.findOne({
			where: {
				id: 'overallStats',
			},
			raw: true,
			attributes: ['noOfGTPSold', 'noOfInvestors', 'amountRaised', 'creditsRetired', 'date'],
		})

		let bulkCreatePayload: PlatformAnalyticsInterface[] = []

		// Create Default stats in DB (if no default data)
		if (!overallStats) {
			bulkCreatePayload = [
				{
					...defaultPayload,
					id: 'overallStats',
				},
				{
					...defaultPayload,
					id: 'sevenDayStats',
				},
				{
					...defaultPayload,
					id: 'fourteenDayStats',
				},
				{
					...defaultPayload,
					id: 'thirtyDayStats',
				},
			]

			await PlatformAnalytics.bulkCreate(bulkCreatePayload)

			return await PlatformAnalytics.create({
				id: uuid(),
				...defaultPayload,
			})
		}

		const checkDuplicate = await PlatformAnalytics.findOne({
			where: {
				date: currentDate,
				id: {
					[Op.notIn]: ['overallStats', 'sevenDayStats', 'fourteenDayStats', 'thirtyDayStats'],
				},
			},
			raw: true,
			attributes: ['id'],
		})

		if (checkDuplicate) return

		const {
			creditsRetired: overallCreditsRetired,
			noOfGTPSold: overallNoOfGTPSold,
			amountRaised: overallAmountRaised,
			noOfInvestors: overallNoOfInvestors,
		} = overallStats

		await PlatformAnalytics.create({
			id: uuid(),
			creditsRetired: creditsRetired - overallCreditsRetired,
			noOfGTPSold: noOfGTPSold - overallNoOfGTPSold,
			amountRaised: amountRaised - overallAmountRaised,
			noOfInvestors: noOfInvestors - overallNoOfInvestors,
			date: currentDate,
			month: currentMonth,
			amountToBeReaised,
			totalGTP,
		})

		const attributes: any = [
			[
				Sequelize.cast(Sequelize.fn('sum', Sequelize.col('creditsRetired')), 'int'),
				'creditsRetired',
			],
			[Sequelize.cast(Sequelize.fn('sum', Sequelize.col('noOfGTPSold')), 'int'), 'noOfGTPSold'],
			[Sequelize.cast(Sequelize.fn('sum', Sequelize.col('amountRaised')), 'int'), 'amountRaised'],
			[Sequelize.cast(Sequelize.fn('sum', Sequelize.col('noOfInvestors')), 'int'), 'noOfInvestors'],
		]

		const idFilter = {
			[Op.notIn]: ['overallStats', 'sevenDayStats', 'fourteenDayStats', 'thirtyDayStats'],
		}

		const sevenDays = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000)
		const sevenDayStats = await PlatformAnalytics.findAll({
			where: {
				date: {
					[Op.gte]: sevenDays,
					[Op.lte]: currentDate,
				},
				id: idFilter,
			},
			raw: true,
			attributes,
		})

		const fourteenDays = new Date(currentDate.getTime() - 14 * 24 * 60 * 60 * 1000)
		const fourteenDayStats = await PlatformAnalytics.findAll({
			where: {
				date: {
					[Op.gte]: fourteenDays,
					[Op.lte]: currentDate,
				},
				id: idFilter,
			},
			raw: true,
			attributes,
		})

		const thirtyDays = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000)
		const thirtyDayStats = await PlatformAnalytics.findAll({
			where: {
				date: {
					[Op.gte]: thirtyDays,
					[Op.lte]: currentDate,
				},
				id: idFilter,
			},
			raw: true,
			attributes,
		})

		// Update default Data
		bulkCreatePayload = [
			{
				creditsRetired,
				noOfGTPSold,
				amountRaised,
				noOfInvestors,
				date: overallStats.date,
				id: 'overallStats',
				month: currentMonth,
				amountToBeReaised,
				totalGTP,
			},
			{
				...sevenDayStats[0],
				amountToBeReaised,
				totalGTP,
				id: 'sevenDayStats',
			},
			{
				...fourteenDayStats[0],
				amountToBeReaised,
				totalGTP,
				id: 'fourteenDayStats',
			},
			{
				...thirtyDayStats[0],
				amountToBeReaised,
				totalGTP,
				id: 'thirtyDayStats',
			},
		]

		return await PlatformAnalytics.bulkCreate(bulkCreatePayload, {
			updateOnDuplicate: [
				'creditsRetired',
				'noOfGTPSold',
				'amountRaised',
				'noOfInvestors',
				'amountToBeReaised',
				'totalGTP',
			],
		})
	} catch (error) {
		Logger.error(error)
	}
}

export const getPlatformAnalyticsService = async (entity: string) => {
	try {
		Logger.info('inside get PlatformAnalytics Service')

		return await PlatformAnalytics.findOne({
			where: {
				id: entity,
			},
			raw: true,
			attributes: [
				'noOfGTPSold',
				'noOfInvestors',
				'amountRaised',
				'creditsRetired',
				'amountToBeReaised',
				'totalGTP',
			],
		})
	} catch (err) {
		Logger.error(err)
		throw err
	}
}

export const getPlatformStatsMonthlyGraphService = async (year: number) => {
	try {
		Logger.info('inside get PlatformStats Monthly GraphService')

		return await PlatformAnalytics.findAll({
			where: {
				date: {
					[Op.gte]: new Date(`${year}-01-01`),
					[Op.lte]: new Date(`${year}-12-31`),
				},
				id: {
					[Op.notIn]: ['overallStats', 'sevenDayStats', 'fourteenDayStats', 'thirtyDayStats'],
				},
			},
			raw: true,
			attributes: [
				[
					Sequelize.cast(Sequelize.fn('sum', Sequelize.col('noOfInvestors')), 'int'),
					'noOfInvestors',
				],
				[
					Sequelize.cast(Sequelize.fn('sum', Sequelize.col('creditsRetired')), 'int'),
					'creditsRetired',
				],
				'month',
			],
			group: ['month'],
		})
	} catch (err) {
		Logger.error(err)
		throw err
	}
}

export const getPlatformStatsGraphService = async (filter?: {
	date: {
		[Op.gte]: Date
		[Op.lte]: Date
	}
}) => {
	try {
		Logger.info('inside get PlatformStats Graph Service Service')

		const whereClause = filter || {}
		return await PlatformAnalytics.findAll({
			where: {
				...whereClause,
				id: {
					[Op.notIn]: ['overallStats', 'sevenDayStats', 'fourteenDayStats', 'thirtyDayStats'],
				},
			},
			raw: true,
			attributes: ['noOfInvestors', 'creditsRetired', 'date'],
			order: [['createdAt', 'ASC']],
		})
	} catch (err) {
		Logger.error(err)
		throw err
	}
}

export const getNotifyMeEnabledUserIds = async (payload: Partial<NotifyInterface>) => {
	Logger.info('inside send Notification notify me enabled service')
	try {
		const data = await Notify.findAll({
			where: payload,
		})
		const userIds: any[] = data.map((ele) => ele.userId)
		return userIds
	} catch (err) {
		Logger.error(err)
		return null
	}
}

export const enableNotifyMeService = async (projectId: number, userId: string) => {
	Logger.info('Inside enable notify me service')
	try {
		const isExist = await Notify.findOne({
			where: {
				projectId,
				userId,
			},
		})
		if (isExist) {
			return false
		}

		const notifyme = await Notify.create({ projectId, id: uuid(), userId })

		return notifyme
	} catch (err) {
		Logger.error(err)
		throw err
	}
}

export const disableNotificationService = async (projectId: number, userId: string) => {
	Logger.info('Inside enable notify me service')
	try {
		const notifyIsDisabled = await Notify.destroy({
			where: {
				userId,
				projectId,
			},
		})
		if (notifyIsDisabled === 0) {
			return false
		}
		return true
	} catch (err) {
		Logger.error(err)
		throw err
	}
}

export const getUpcommingProjects = async (userId: string, options: any) => {
	Logger.info('Inside get Upcomming projects service')
	try {
		const listProject = await Projects.findAndCountAll(options)
		let notification: any[] = []
		listProject.rows.forEach((project: any) => {
			notification = project.dataValues.notification
			let length = 0
			notification.forEach((ele: any) => {
				length += 1
				if (ele.userId === userId) {
					project.dataValues.notify = true
				} else {
					project.dataValues.notify = false
				}
			})
			if (length === 0) {
				project.dataValues.notify = false
			}
		})
		return listProject
	} catch (err) {
		Logger.error(err)
		throw err
	}
}

export const updateNotifyMeService = async (
	projectId: number,
	userId: string,
	payload: Partial<NotifyInterface>
) => {
	Logger.info('Inside update notify me service')
	try {
		const data = await Notify.findOne({
			where: {
				userId,
				projectId,
			},
		})
			.then((result) => {
				if (result === null) {
					false
				}
				result?.update(payload, {
					where: {
						userId,
						projectId,
					},
				})
			})
			.catch((err) => false)

		return true
	} catch (err) {
		Logger.error(err)
		throw err
	}
}

export const notifcationCronJobForDraftProject = async () => {
	Logger.info('inside send notification for draft project')
	try {
		const projectsData = await Projects.findAll({
			where: {
				is_submitted: false,
			},
		})
		const token = await getAuthToken()
		if (token === null) {
			return false
		}
		const authorizationData = `Bearer ${token}`
		projectsData.forEach(async (ele) => {
			const projectData: any = await Projects.findByPk(ele.id, {
				include: [
					{
						model: User,
					},
				],
			})

			const todayDay = new Date()
			const after3daysdateOfcreateAt = new Date(ele.createdAt.getDate() + 3)
			const after3daysdateString = `${after3daysdateOfcreateAt.getFullYear()}-${after3daysdateOfcreateAt.getMonth()}-${after3daysdateOfcreateAt.getDate()}`
			const todayDayString = `${todayDay.getFullYear()}-${todayDay.getMonth()}-${todayDay.getDate()}`

			if (after3daysdateString === todayDayString) {
				await axios
					.post(
						`${Config.NOTIFICATION.SEND}/${ele.userId}`,
						{
							title: 'Seed Success',
							body: `${ele.title} is in the drafts. Complete the project to start your project verification.`,
							topic: `user-${ele.userId}`,
						},
						{
							headers: {
								authorization: authorizationData!,
							},
						}
					)
					.catch((err) => {
						Logger.error(err)
					})
			}
		})
	} catch (err) {
		Logger.error(err)
		return false
	}
}

export const userPortfolioDataService = async (
	userId: string,
	type: string,
	activity: string,
	category: string,
	methodology: string,
	country: string
) => {
	Logger.info('inside user portfolio Data service ')
	try {
		let total_credits: number = 0
		let total_investment: number = 0
		const blockChainBalanceData = await BlockchainBalance.findAll({
			where: { userId },
		})

		const projectIds = blockChainBalanceData.map((ele) => ele.projectId)
		const options: any = {
			where: {
				id: {
					[Op.in]: projectIds,
				},
			},
		}

		if (type !== '') {
			options.where.type = type
		}
		if (activity !== '') {
			options.where.activity = activity
		}
		if (methodology !== '') {
			options.where.methodology = methodology
		}
		if (country !== '') {
			options.where.country = country
		}

		const projectsData = await Projects.findAll(options)
		blockChainBalanceData.forEach((ele) => {
			projectsData.forEach((project) => {
				if (ele.projectId === project.id) {
					total_investment = total_investment + ele.noOfGTPToken * project.price_per_token
					total_credits = total_credits + ele.noOfGTPToken
				}
			})
		})
		const countryOptions: any = {
			plain: false,
			where: {
				id: {
					[Op.in]: projectIds,
				},
			},
		}
		if (country !== '') {
			countryOptions.where.country = country
		}
		const numberOfCountries: any[] = await Projects.aggregate('country', 'DISTINCT', countryOptions)

		const activities = await Projects.count({
			col: 'activity',
			group: ['activity'],
			where: options.where,
		})
		let total = 0
		let totalTypesOfActivity = 0
		const filteredActivities = activities.filter((ele) => {
			if (ele.activity !== null) {
				totalTypesOfActivity += 1
				total = total + ele.count
				return ele
			}
		})

		return {
			total_investment,
			totalProjectToken: total_credits,
			total_projects: projectsData.length,
			totalCountries: numberOfCountries.length,
			activitiesData: filteredActivities,
			totalActivities: total,
			totalTypesOfActivity,
		}
	} catch (error) {
		Logger.error(error)
		throw error
	}
}

export const sendNotificationService = async (
	notificationObj: {
		title: string
		body: string
		topic: string
		hasLink?: boolean | undefined
		link?: string | undefined
		linkMsg?: string | undefined
		liveDate?: Date | undefined
	},
	userId: string,
	authorizationData: string
) => {
	Logger.info('Inside send notification service')
	try {
		const { title, body, topic, hasLink, link, linkMsg, liveDate } = notificationObj
		await axios
			.post(
				`${Config.NOTIFICATION.SEND}/${userId}`,
				{
					title,
					body,
					hasLink,
					link,
					linkMsg,
					liveDate,
					topic,
				},
				{
					headers: {
						authorization: authorizationData,
					},
				}
			)
			.catch((err) => {
				Logger.error(err)
				return false
			})

		return true
	} catch (error) {
		Logger.error(error)
		return false
	}
}

export const getSuperAdminService = async (authToken: string) => {
	Logger.info('inside get Super Admin Service ')
	try {
		const response: any = await axios.get(`${Config.ADMIN.GET_SUPER_ADMIN}`, {
			headers: {
				authorization: authToken,
			},
		})

		const superAdmin: AdminInterface = response.data?.data
		if (!superAdmin) return null

		return superAdmin
	} catch (err) {
		Logger.error(err)
	}
}
