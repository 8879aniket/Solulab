import { Optional } from 'sequelize'

import {
	Table,
	Model,
	Column,
	AfterUpdate,
	AfterCreate,
	DataType,
	HasMany,
} from 'sequelize-typescript'
import { AdminInterface } from '@interfaces/admin'

interface UserAttributes extends Optional<AdminInterface, 'id'> {}

@Table({ timestamps: true })
class _admin extends Model<AdminInterface, UserAttributes> {
	@Column({ primaryKey: true })
	id!: string
	@Column
	name!: string
	@Column({ unique: true })
	email!: string
	@Column({ type: DataType.BIGINT })
	mobileNumber!: number
	@Column
	countryCode!: string
	@Column
	password!: string
	@Column({ defaultValue: false })
	twoFAStatus!: boolean
	@Column
	twoFAType!: string
	@Column
	otpCode!: number
	@Column // ["ADMIN","SUPER_ADMIN","PROJECT_DEVELOPER"]
	accountType!: string
	@Column // In future it will have multiple roles ["ADMIN"]
	role!: string
	@Column({ defaultValue: true })
	firstTimeLogin!: boolean
	@Column({ defaultValue: true })
	isActive!: boolean
	@Column({ defaultValue: '' })
	profilePic!: string
	@Column
	walletId!: string
	@Column
	walletType!: string
	@Column
	walletDescription!: string
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

	@Column({ defaultValue: 3 })
	otpLimit!: number
	@Column
	otpBlockTime!: Date
	@Column
	otpExpire!: Date
	@Column({ defaultValue: false })
	isOTPBlocked!: boolean
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
}

export default _admin
