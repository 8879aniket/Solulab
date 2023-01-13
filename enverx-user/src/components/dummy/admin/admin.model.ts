import { Optional } from 'sequelize'

import { Table, Model, Column, HasMany, DataType } from 'sequelize-typescript'

import { AdminInterface } from '@interfaces/_admin'

interface UserAttributes extends Optional<AdminInterface, 'id'> {}

@Table({ timestamps: true })
class _admin extends Model<AdminInterface, UserAttributes> {
	@Column({ primaryKey: true })
	id!: string
	@Column
	name!: string
	@Column({ unique: true })
	email!: string
	@Column
	companyName!: string
	@Column
	companyRegistrationNumber!: string
	@Column({ unique: true })
	mobileNumber!: number
	@Column
	countryCode!: string
	@Column
	companyWebsite!: string
	@Column
	country!: string
	@Column
	state!: string
	@Column
	city!: string
	@Column
	pinCode!: number
	@Column
	password!: string
	@Column({ defaultValue: false })
	twoFAStatus!: boolean
	@Column
	twoFAType!: string
	@Column
	otpCode!: number
	@Column
	accountType!: string
	@Column
	kycStatus!: string
	@Column({ defaultValue: false })
	kybStatus!: boolean

	// REFERENCE FOR ASSOCIATION
	/* @HasMany(() => Projects, 'userId')
	projects!: Projects[]

	@HasMany(() => Order, 'userId')
	orderId!: number */
}

export default _admin
