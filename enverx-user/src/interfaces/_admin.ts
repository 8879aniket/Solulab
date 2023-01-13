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
	accountType?: string
	kycStatus?: string
	kybStatus?: boolean
}
