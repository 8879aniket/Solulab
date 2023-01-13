import { Optional, DataTypes } from 'sequelize'

import {
	Table,
	Model,
	Column,
	AfterUpdate,
	AfterCreate,
	HasMany,
	DataType,
	ForeignKey,
	BelongsTo,
} from 'sequelize-typescript'

import { ProjectsInterface } from '@interfaces/projects'
import _user from '@dummy/user/user.model'
import YearlyProjectProjection from '@projects/yearlyProjectProjection.model'
import Notify from '@projects/notify.model'

interface ProjectsAttributes extends Optional<ProjectsInterface, 'id'> {}

@Table({ timestamps: true })
class Projects extends Model<ProjectsInterface, ProjectsAttributes> {
	@Column
	title!: string
	@Column
	country!: string
	@Column
	city!: string
	@Column
	state!: string
	@Column
	postal_code!: number
	@Column
	address!: string
	@Column({ type: DataType.DATEONLY })
	vintage!: Date
	@Column({ type: DataType.FLOAT })
	latitude!: number
	@Column({ type: DataType.FLOAT })
	longitude!: number
	@Column
	registry!: string
	@Column
	standard!: string
	@Column
	activity!: string
	@Column
	type!: string
	@Column
	methodology!: string
	@Column
	scale!: string
	@Column({ type: DataType.BIGINT })
	length!: number
	@Column
	project_details_doc!: string
	@Column({ type: DataType.ARRAY(DataType.STRING) })
	project_images!: string[]
	@Column({ type: DataType.ARRAY(DataType.STRING) })
	other_docs!: string[]
	@Column
	project_logo!: string
	@Column
	payment_method!: string
	@Column
	account_type!: string
	@Column
	account_number!: string
	@Column
	routing_number!: string
	@Column
	bank_country!: string
	@Column
	bank_district!: string
	@Column
	bank_name!: string
	@Column
	bank_city!: string
	@Column({ type: DataType.BIGINT })
	iban!: number
	@Column
	plaid_token!: string
	@Column
	billing_name!: string
	@Column
	billing_country!: string
	@Column
	billing_city!: string
	@Column
	billing_address1!: string
	@Column
	billing_address2!: string
	@Column({ type: DataType.BIGINT })
	billing_postal_code!: number
	@Column
	billing_district!: string
	@Column({ type: DataType.DECIMAL })
	seed_credits!: number
	@Column({ type: DataType.DATEONLY })
	expected_credit_date!: Date
	@Column({ type: DataType.FLOAT })
	raise_amount!: number
	@Column({ type: DataType.FLOAT })
	price_per_token!: number
	@Column({ type: DataType.BIGINT })
	project_account_id!: string
	@Column({ defaultValue: 1 })
	step!: number
	@Column({ defaultValue: false })
	is_submitted!: boolean
	@Column({ defaultValue: false })
	bank_account_verified!: boolean
	@Column({ defaultValue: false })
	is_verified!: boolean
	@Column({ defaultValue: 0, type: DataType.FLOAT })
	progress!: number
	@Column({ defaultValue: 0 })
	required_fields_entered?: number
	@Column
	reject_reason!: string
	@Column({ defaultValue: false })
	is_rejected!: boolean
	@Column({ defaultValue: false })
	edit_request!: boolean
	@Column({ defaultValue: 'pending' })
	un_approve_project_status!: string
	@Column({ defaultValue: 'pending' })
	pre_verification_status!: string
	@Column({ defaultValue: 'pending' })
	full_verification_status!: string
	@Column({ defaultValue: 'not_started' })
	seed_status!: string
	@Column
	signatureId!: string
	@Column
	signUrl!: string
	@Column({ defaultValue: false })
	docSigned!: boolean
	@Column
	vvb_id!: string
	@Column
	vvb_name!: string
	@Column
	vvb_insight!: string
	@Column({ type: DataType.TEXT })
	short_description!: string
	@Column
	exact_address!: string
	@Column
	video!: string
	@Column({ type: DataType.FLOAT })
	project_size!: number
	@Column
	man_power!: number
	@Column
	farm_type!: string
	@Column
	approach!: string
	@Column
	key_activities!: string
	@Column({ type: DataType.ARRAY(DataType.STRING) })
	sdg_commitments!: string[]
	@Column({ type: DataType.ARRAY(DataType.STRING) })
	impact_areas!: string[]
	@Column({ type: DataType.FLOAT })
	area_offset_generation!: number
	@Column
	min_annual_sequestration!: number
	@Column
	max_annual_sequestration!: number
	@Column({ type: DataType.FLOAT })
	per_year_annual_sequestration!: number
	@Column
	total_credits_over_project!: number
	@Column
	certification_date!: string
	@Column
	additional_certification!: string
	@Column
	registry_project_id!: string
	@Column({ type: DataType.TEXT })
	large_description!: string
	@Column({ type: DataType.ARRAY(DataType.STRING) })
	pre_verification_report!: string[]
	@Column
	year_of_projection!: string
	@Column
	projection!: string
	@Column({ type: DataType.TEXT })
	additional_note!: string
	@Column({ defaultValue: false })
	live_seed_project!: boolean
	@Column({ defaultValue: false })
	hold_for_full_verification!: boolean
	@Column
	project_seed_start_date!: Date
	@Column
	project_seed_end_date!: Date
	@Column({ defaultValue: false })
	set_live_date!: boolean
	@Column({ type: DataType.ARRAY(DataType.STRING) })
	full_verification_report!: string[]
	@Column({ type: DataType.ARRAY(DataType.STRING) })
	additional_documents!: string[]
	@Column({ defaultValue: false })
	approve_project!: boolean
	@Column
	walletId!: string
	@Column
	walletType!: string
	@Column
	walletDescription!: string
	@Column({ defaultValue: 0 })
	withdraw_amount!: number
	@Column
	last_withdraw_date!: Date
	@Column
	venlyPinCode!: string
	@Column
	blockchainWalletId!: string
	@Column
	blockchainWalletAddress!: string
	@Column
	blockchainWalletDescription!: string
	@Column
	blockchainSecretType!: string
	@Column
	blockchainWalletType!: string
	@Column
	blockchainWalletIdentifier!: string
	@Column({ defaultValue: 'Pending' })
	project_status!: string
	@Column({ defaultValue: 'Unverified' })
	vvb_status!: string
	@Column
	vvb_send_date!: Date
	@Column({ defaultValue: 0 })
	invest_amount!: number
	@Column({ defaultValue: 0 })
	vcc_issued!: number
	@Column({ unique: true })
	tx_hash!: string
	@Column
	uri!: string
	@Column
	blockchain_token_id!: string
	@Column
	pre_verification_cost!: string
	@Column
	vvb_fees!: string
	@Column
	platform_fees!: string
	@Column({ type: DataType.FLOAT })
	total_project_raise_amount!: number
	@Column
	submitted_at!: Date
	@Column
	approved_at!: Date
	@Column
	fully_verified_at!: Date
	//TODO: Credits Issued Timeline (Should be there only when credits are added)
	@Column
	first_credits_issued_at!: Date
	@Column({ defaultValue: false })
	can_add_credits!: boolean

	@Column({ defaultValue: 0 })
	noOfGTPAvailable!: number
	@Column({ defaultValue: 0 })
	noOfGTPSold!: number

	@Column({ defaultValue: 20 })
	totalNoOfInvestors!: number

	@Column({ defaultValue: 0 })
	currentNoOfInvestors!: number

	@Column({ defaultValue: false })
	canWithdraw!: boolean

	@Column({ defaultValue: false })
	is_vcc_issued!: boolean

	@Column({ defaultValue: false })
	is_fees_paid!: boolean

	@Column({ defaultValue: 0 })
	total_vcc_issued!: number

	@Column
	project_type!: string
	@Column
	project_sub_type!: string

	@Column
	registryLogo!: string
	@Column
	vvbLogo!: string

	@ForeignKey(() => _user)
	@Column
	userId!: string

	@Column({ defaultValue: false })
	isDisabled!: Boolean

	@Column
	BaseCcyCode!: string

	@Column
	CcyCode!: string

	@Column
	potPrefix!: string

	@BelongsTo(() => _user)
	user!: _user[]

	@HasMany(() => YearlyProjectProjection, { onDelete: 'SET NULL' })
	yearlyProjectProjection!: YearlyProjectProjection[]

	@HasMany(() => Notify, { onDelete: 'SET NULL' })
	notification!: Notify[]
}

export default Projects
