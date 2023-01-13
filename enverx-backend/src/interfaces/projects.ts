export interface ProjectsInterface {
	id: string
	title?: string
	country?: string
	state?: string
	vintage?: Date
	latitude?: number
	longitude?: number
	registry?: string
	standard?: string
	type?: string
	methodology?: string
	scale?: string
	project_details_doc?: string
	project_images?: string[]
	other_docs?: string[]
	project_logo?: string
	payment_method?: string
	account_type?: string
	account_number?: string
	routing_number?: string
	bank_country?: string
	bank_name?: string
	bank_city?: string
	bank_district?: string
	billing_name?: string
	billing_country?: string
	billing_city?: string
	billing_address1?: string
	billing_address2?: string
	billing_postal_code?: number
	billing_district?: string
	seed_credits?: number
	expected_credit_date?: Date
	raise_amount?: number
	price_per_token?: number
	userId?: string
	project_account_id?: string
	step?: number
	is_submitted?: boolean
	bank_account_verified?: boolean
	// is_approved?: boolean
	is_verified?: boolean
	// is_admin_approved?: boolean
	// is_seed_approved?: boolean
	progress?: number
	required_fields_entered?: any
	city?: string
	postal_code?: number
	address?: string
	activity?: string
	length?: number
	iban?: number
	plaid_token?: string
	is_rejected?: boolean
	reject_reason?: string
	edit_request?: boolean
	un_approve_project_status?: string
	pre_verification_status?: string
	full_verification_status?: string
	seed_status?: string
	signatureId?: string
	signUrl?: string
	docSigned?: boolean
	vvb_id?: string
	vvb_name?: string
	vvb_insight?: string
	vvb_send_date?: Date
	short_description?: string
	exact_address?: string
	video?: string
	project_size?: number
	man_power?: number
	farm_type?: string
	approach?: string
	key_activities?: string
	sdg_commitments?: string[]
	impact_areas?: string[]
	area_offset_generation?: number
	min_annual_sequestration?: number
	max_annual_sequestration?: number
	per_year_annual_sequestration?: number
	total_credits_over_project?: number
	certification_date?: string
	additional_certification?: string
	registry_project_id?: string
	large_description?: string
	pre_verification_report?: string[]
	year_of_projection?: string
	projection?: string
	additional_note?: string
	live_seed_project?: boolean
	hold_for_full_verification?: boolean
	project_seed_start_date?: Date
	project_seed_end_date?: Date
	set_live_date?: boolean
	full_verification_report?: string[]
	additional_documents?: string[]
	approve_project?: boolean
	walletId?: string
	walletType?: string
	walletDescription?: string
	withdraw_amount?: number
	last_withdraw_date?: Date
	venlyPinCode?: string
	blockchainWalletId?: string
	blockchainWalletAddress?: string
	blockchainWalletDescription?: string
	blockchainSecretType?: string
	blockchainWalletType?: string
	blockchainWalletIdentifier?: string
	project_status?: string
	vvb_status?: string
	invest_amount?: number
	vcc_issued?: number
	tx_hash?: string
	uri?: string
	blockchain_token_id?: string
	pre_verification_cost?: string
	vvb_fees?: string
	platform_fees?: string
	total_project_raise_amount?: number
	submitted_at?: Date
	approved_at?: Date
	seed_completed_at?: Date
	fully_verified_at?: Date
	//TODO: Credits Issued Timeline
	first_credits_issued_at?: Date
	can_add_credits?: boolean
	noOfGTPAvailable?: number
	noOfGTPSold?: number
	totalNoOfInvestors?: number
	currentNoOfInvestors?: number
	canWithdraw?: boolean
	is_vcc_issued?: boolean
	is_fees_paid?: boolean
	total_vcc_issued?: number
	project_type?: string
	project_sub_type?: string
	registryLogo?: string
	vvbLogo?: string
	isDisabled?: Boolean
	BaseCcyCode?: string
	CcyCode?: string
	potPrefix?: string
}

export interface ProjectTransactionInterface {
	id: string
	transactionHash?: string
	tokenId?: string
	projectId?: number
	amount?: number
	projectStartDate?: Date
	projectEndDate?: Date
	projectLength?: number
	uri?: string
	userId?: string
}

export interface TokenTransactionInterface {
	id: string
	transactionHash?: string
	tokenId?: string
	projectId?: number
	tokenQuantity?: number
	fromWalletAddress?: string
	toWalletAddress?: string
	eventType?: string
	userId?: string
}

export interface SeedVccCreditsInterface {
	id: string
	projectId: number
	projectTokenId: string
	serialNumber: string
	quantityIssued?: number
	additionalCertificates: string[]
	gasFees?: number
	transactionHash: string
	userWallet: string
}
export interface YearlyProjectProjectionInterface {
	id: string
	projected_credits?: number
	year?: Date
	projectId?: number
	sold?: number
	realised?: number
	fullYear?: number
	credit_retired?: number
	vcc_issued?: number
}

export interface MerkleInterface {
	id: string
	userId: string
	walletAddress: string
}
export interface BlockchainBalanceInterface {
	id: string
	transactionHash?: string
	tokenId?: string
	projectId?: number
	projectName?: string
	userId?: string
	userName?: string
	noOfGTPToken?: number
	noOfVCCToken?: number
	vccTokenId?: string[]
}

export interface BlockchainProofInterface {
	id: string
	previousLength?: number
	merkleRoot?: string
	merkleProof?: string
}

export interface VccTokenTransactionInterface {
	id: string
	transactionHash?: string
	tokenId?: string
	projectId?: number
	projectTitle?: string
	projectMethodology?: string
	vccQuantity?: number
	vccTokenId?: string[]
	uri?: string
	userId?: string
	toWalletAddress?: string
	fromWalletAddress?: string
	transactionStatus?: string
	retireBy?: string
}

export interface CountriesInterface {
	id: string
	country: string
	code: string
	circle: boolean
}

export interface StatesInterface {
	id: string
	countryCode: string
	stateCode: string
	state: string
}

export interface DistrictsInterface {
	id: string
	country: string
	districtCode: string
	district: string
}

export interface RoadmapInterface {
	id: string
	projectId: number
	verification: string
	subVerification: string
	status: boolean
	dateOfVerification?: Date
}

export interface InvestmentsInterface {
	id: string
	year: number
	month: string
	amountRaised: number
}

export interface PlatformAnalyticsInterface {
	id: string
	noOfGTPSold: number
	noOfInvestors: number
	amountRaised: number
	creditsRetired: number
	date: Date
	month: string
	amountToBeReaised: number
	totalGTP: number
}

export interface NotifyInterface {
	id: string
	userId: string
	projectId: number
	isInvested?: boolean
}
