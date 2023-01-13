import { Optional } from 'sequelize'

import {
	Table,
	Model,
	Column,
	HasMany,
	DataType,
	AfterCreate,
	AfterUpdate,
} from 'sequelize-typescript'

import { UserInterface } from '@interfaces/user'
import { afterCreateHooks, afterUpdateHooks } from './hooks'
import BankDetails from '@user/bankDetails.model'

interface UserAttributes extends Optional<UserInterface, 'id'> {}

@Table({ timestamps: true })
class User extends Model<UserInterface, UserAttributes> {
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
	@Column
	passwordChangedAt!: Date
	@Column
	passwordChangeByUserTokenCreatedAt!: Date
	@Column({ defaultValue: 5 })
	otpMobileLimit!: number
	@Column
	mobileOtpBlockTime!: Date
	@Column({ defaultValue: false })
	mobileOtpBlocked!: boolean

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
	// @Column
	// bankAccountId!: string
	// Circle Vatiables

	@Column({ type: DataType.DATEONLY })
	echoStartDate!: Date
	@Column({ type: DataType.DATEONLY })
	echoEndDate!: Date
	@Column({ type: DataType.DATE })
	priceLastUpdatedAt!: Date
	@Column({ defaultValue: false })
	isEchoSubscribed!: boolean
	@Column({ defaultValue: false })
	isEchoBlocked!: boolean
	@Column({ type: DataType.DATE })
	lastLogout!: Date
	@Column
	addressLine1!: string
	@Column
	addressLine2!: string
	@Column({ defaultValue: true })
	firstLogin!: boolean

	@Column
	authSecret!: string
	@Column
	emailVerificationToken!: string
	@Column
	emailVerificationExpiry!: Date

	@Column
	firstname!: string
	@Column
	lastname!: string
	@Column
	address1!: string
	@Column
	houseNameNumber!: string
	@Column
	city!: string
	@Column
	title!: string
	@Column
	gender!: string
	@Column
	caxtonMemorableWord!: string
	@Column
	primaryContactNo!: string
	@Column
	dateOfBirth!: string
	@Column
	caxtonProduct!: string
	@Column
	caxtonApplicantId!: string
	@Column
	caxtonUserId!: string
	@Column
	caxtonPaymentReference!: string
	@Column
	caxtonReferralCode!: string
	@Column
	caxtonPrimaryAccountId!: string
	@Column
	caxtonPassword!: string

	@HasMany(() => BankDetails, { onDelete: 'SET NULL' })
	bankAccounts!: BankDetails[]

	// REFERENCE FOR ASSOCIATION
	/* @HasMany(() => Projects, 'userId')
	projects!: Projects[]

	@HasMany(() => Order, 'userId')
	orderId!: number */

	// Hooks
	@AfterCreate
	static beforeCreateDummyModel(instance: User) {
		afterCreateHooks(instance)
	}

	@AfterUpdate
	static updateDummyModel(instance: User) {
		afterUpdateHooks(instance)
	}
}

export default User
