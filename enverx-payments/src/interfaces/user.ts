export interface UserInterface {
	id: string
	companyName?: string
	companyRegistrationNumber?: string
	companyWebsite?: string
	country?: string
	state?: string
	postalCode?: number
	email: string
	countryCode?: string
	mobileNumber: number
	password?: string
	twoFAStatus?: boolean
	twoFAType?: string
	otpCode?: number
	userType: 'INVESTOR' | 'PROJECT_DEVELOPER'
	fcmToken?: string
	walletId?: string
	walletType?: string
	walletDescription?: string
	entityType: 'COMPANY' | 'INDIVIDUAL'
	name?: string
	kycStatus?: 'PENDING' | 'APPROVED' | 'REJECTED'
	accountType?: string
	profilePic?: string
	DOB?: Date
	isRegistered?: boolean
	isPurchaser?: boolean
	isBlocked?: boolean
	otpLimit?: number
	otpBlockTime?: Date
	otpExpire?: Date
	isOTPBlocked?: boolean
	mobileNoVerified?: boolean
	emailVerified?: boolean
	kycVerificationId?: string
	venlyPinCode?: string
	blockchainWalletId?: string
	blockchainWalletAddress?: string
	blockchainWalletDescription?: string
	blockchainSecretType?: string
	blockchainWalletType?: string
	blockchainWalletIdentifier?: string
	passwordResetToken?: string
	passwordResetExpired?: Date
	loginAttempt?: number
	loginBlockedTime?: Date
	isLoginBlocked?: boolean
	incorrectOtpAttempt?: number
	forgotPasswordLimit?: number
	forgotPasswordBlockTime?: Date
	echoStartDate?: Date
	echoEndDate?: Date
	isEchoSubscribed?: boolean
	isEchoBlocked?: boolean
	passwordChangedAt?: Date
	passwordChangeByUserTokenCreatedAt?: Date
	otpMobileLimit?: number
	mobileOtpBlockTime?: Date
	mobileOtpBlocked?: boolean
	lastLogout?: Date
}

//? For future reference
export interface UserRole {}

enum UserAccountType {
	ADMIN = 'ADMIN',
	SUPER_ADMIN = 'SUPER_ADMIN',
	PROJECT_DEVELOPER = 'PROJECT_DEVELOPER',
}

export interface BankDetailsInterface {
	id?: string
	account_number?: string
	routing_number?: string
	IBAN?: string
	account_id?: string
	status?: string
	description?: string
	tracking_ref?: string
	fingerprint?: string
	billing_name: string
	billing_city: string
	billing_country: string
	billing_line1: string
	billing_line2?: string
	billing_district?: string
	billing_postalCode: string
	bank_name?: string
	bank_city?: string
	bank_country?: string
	bank_line1?: string
	bank_line2?: string
	bank_district?: string
	userId?: string
	type_of_account: string | 'US' | 'IBAN' | 'NON_IBAN' | 'ACH'
	plaid_access_token?: string
	plaid_processer_token?: string
	email?: string
	ip_address?: string
	phone_number?: string
	session_id?: string
	is_disposed?: boolean
}
