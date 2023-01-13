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
// import { afterCreateHooks } from './hooks'
import { TransactionInterface } from '@interfaces/transaction'
import _user from '@dummy/user/user.model'

interface TransactionAttributes extends Optional<TransactionInterface, 'id'> {}

@Table({ timestamps: true })
class Transactions extends Model<TransactionInterface, TransactionAttributes> {
	@Column({ primaryKey: true })
	id!: string
	@Column
	transaction_id!: string
	@Column
	transaction_type!: string
	@Column
	tracking_ref!: string
	@Column
	source_wallet_type!: string
	@Column
	source_wallet_id!: string
	@Column
	destination_wallet_type!: string
	@Column
	destination_wallet_id!: string
	@Column({ type: DataType.FLOAT })
	amount!: number
	@Column({ type: DataType.FLOAT })
	amountRecived!: number
	@Column
	currency!: string
	@Column
	status!: string
	@Column
	internalStatus!: string
	@Column
	bankName!: string
	@Column({ defaultValue: 'completed' })
	tokenTransferedStatus!: string

	//! @todo This schema is for future project scope
	// @Column({ defaultValue: true })
	// isInvestmentSuccess!: boolean
	// @Column
	// investmentTransactionHash!: string

	@ForeignKey(() => _user)
	@Column
	userId!: string

	@BelongsTo(() => _user, { foreignKey: 'userId' })
	user!: _user[]
}

export default Transactions
