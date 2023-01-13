import { Optional } from 'sequelize'

import {
	Table,
	Model,
	Column,
	HasMany,
	DataType,
	AfterCreate,
	ForeignKey,
	BelongsTo,
} from 'sequelize-typescript'

import { BankDetailsInterface } from '@interfaces/user'
import User from '@dummy/user/user.model'
// import { afterCreateHooks } from './hooks'
interface BankDetailsAttributes extends Optional<BankDetailsInterface, 'id'> {}

@Table({ timestamps: true })
class _bankDetails extends Model<BankDetailsInterface, BankDetailsAttributes> {
	@Column({ primaryKey: true })
	id!: string
	@Column
	account_number!: string
	@Column
	routing_number!: string
	@Column
	IBAN!: string
	@Column
	account_id!: string
	@Column
	status!: string
	@Column
	description!: string
	@Column
	tracking_ref!: string
	@Column
	fingerprint!: string
	@Column
	billing_name!: string
	@Column
	billing_city!: string
	@Column
	billing_country!: string
	@Column
	billing_line1!: string
	@Column
	billing_line2!: string
	@Column
	billing_district!: string
	@Column
	billing_postalCode!: string
	@Column
	bank_name!: string
	@Column
	bank_city!: string
	@Column
	bank_country!: string
	@Column
	bank_line1!: string
	@Column
	bank_line2!: string
	@Column
	bank_district!: string
	@Column
	type_of_account!: string
	@Column
	plaid_access_token!: string
	@Column
	plaid_processer_token!: string
	@Column
	email!: string
	@Column
	ip_address!: string
	@Column
	phone_number!: string
	@Column
	session_id!: string
	@Column({ defaultValue: false })
	is_project_account!: boolean

	@ForeignKey(() => User)
	@Column
	userId!: string

	@BelongsTo(() => User)
	user!: User[]
}

export default _bankDetails
