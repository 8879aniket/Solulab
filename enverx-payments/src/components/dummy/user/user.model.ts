import { Optional } from 'sequelize'

import { Table, Model, Column, DataType, HasMany } from 'sequelize-typescript'

import { UserInterface } from '@interfaces/user'

interface UserAttributes extends Optional<UserInterface, 'id'> {}

@Table({ timestamps: true })
class _user extends Model<UserInterface, UserAttributes> {
	@Column({ primaryKey: true })
	id!: string
	@Column({ unique: true })
	email!: string
	@Column
	companyName!: string
	@Column
	companyRegistrationNumber!: string
	@Column
	companyWebsite!: string
	@Column
	country!: string
	@Column
	state!: string
	@Column
	postalCode!: number
	@Column
	countryCode!: string
	@Column({ type: DataType.BIGINT })
	mobileNumber!: number
	@Column
	password!: string
	@Column({ defaultValue: false })
	twoFAStatus!: boolean
	@Column
	twoFAType!: string
	@Column
	otpCode!: number
	@Column
	userType!: string
	@Column
	fcmToken!: string
	@Column
	entityType!: string
	@Column
	name!: string
	@Column({ defaultValue: 'PENDING' })
	kycStatus!: string
	@Column({ defaultValue: 'USER' })
	accountType!: string
	@Column({ defaultValue: '' })
	profilePic!: string
	@Column({ type: DataType.DATEONLY })
	DOB!: Date
	@Column({ defaultValue: false })
	isRegistered!: boolean
	@Column({ defaultValue: false })
	isPurchaser!: boolean
	@Column({ defaultValue: false })
	isBlocked!: boolean
	@Column({ defaultValue: false })
	mobileNoVerified!: boolean
	@Column({ defaultValue: false })
	emailVerified!: boolean
	@Column
	kycVerificationId!: string
	@Column
	passwordResetToken!: string
	@Column
	passwordResetExpired!: Date
	@Column({ defaultValue: 5 })
	loginAttempt!: number
	@Column
	loginBlockedTime!: Date
	@Column({ defaultValue: false })
	isLoginBlocked!: boolean
	@Column({ defaultValue: 3 })
	incorrectOtpAttempt!: number
	@Column({ defaultValue: 3 })
	forgotPasswordLimit!: number
	@Column
	forgotPasswordBlockTime!: Date
	@Column({ defaultValue: false })
	linkSentBlocked!: boolean

	// Circle Variables
	@Column
	walletId!: string
	@Column
	walletType!: string
	@Column
	walletDescription!: string
	@Column({ defaultValue: 5 })
	otpLimit!: number
	@Column
	otpBlockTime!: Date
	@Column
	otpExpire!: Date
	@Column({ defaultValue: false })
	isOTPBlocked!: boolean
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
	@Column
	passwordChangedAt!: Date
	@Column
	passwordChangeByUserTokenCreatedAt!: Date
	@Column
	otpMobileLimit!: number
	@Column
	mobileOtpBlockTime!: Date
	@Column({ defaultValue: false })
	mobileOtpBlocked!: boolean

	@Column({ type: DataType.DATE })
	echoStartDate!: Date
	@Column({ type: DataType.DATE })
	echoEndDate!: Date
	@Column({ type: DataType.DATE })
	priceLastUpdatedAt!: Date
	@Column({ defaultValue: false })
	isEchoSubscribed!: boolean
	@Column({ defaultValue: false })
	isEchoBlocked!: boolean
	@Column({ type: DataType.DATE })
	lastLogout!: Date
}

export default _user
