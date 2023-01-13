export interface kybPayloadInterface {
	firstname: string
	lastname: string
	houseNameNumber: string
	mobileNumber?: string
	address1: string
	city: string
	title: string
	gender: string
	dateOfBirth: string
	postcode?: string
	country: string
	companyName: string
	companyRegistrationNumber: string
	companyWebsite: string
	state: string
	countryCode: string
}

export interface caxtonOnboardInterface {
	memorableWord: string
	primaryContactNo: string
	product: string
	password: string
	email: string
	id: string
	firstname: string
	lastname: string
	houseNameNumber: string
	mobileNumber?: string
	address1: string
	city: string
	title: string
	gender: string
	dateOfBirth: string
	postcode?: string
	country: string
}

export interface caxtonLoginInterface {
	userEmail: string
	password: string
	deviceId: string
	device: string
	operatingSystem: string
}
