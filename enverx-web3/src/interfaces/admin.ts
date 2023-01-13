export interface AdminInterface {
	id: string
	name: string
	email: string
	companyName?: string
	companyRegistrationNumber?: string
	mobileNumber?: number
	countryCode?: string
	companyWebsite?: string
	country?: string
	state?: string
	city?: string
	pinCode?: number
	password?: string
	twoFAStatus?: boolean
	twoFAType?: string
	otpCode?: number
	accountType: 'ADMIN' | 'SUPER_ADMIN' | 'PROJECT_DEVELOPER'
	kycStatus?: string
	kybStatus?: boolean
	firstTimeLogin?: boolean
	role: string
}

//? For future reference
export interface UserRole {}

enum UserAccountType {
	ADMIN = 'ADMIN',
	SUPER_ADMIN = 'SUPER_ADMIN',
	PROJECT_DEVELOPER = 'PROJECT_DEVELOPER',
}
