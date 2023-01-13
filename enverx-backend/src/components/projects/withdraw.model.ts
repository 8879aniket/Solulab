import { Optional, DataTypes } from 'sequelize'

import { Table, Model, Column, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript'

import WithdrawInterface from '@interfaces/withdraw'

interface WithdrawAttributes extends Optional<WithdrawInterface, 'id'> {}

@Table({ timestamps: true })
class Withdraw extends Model<WithdrawInterface, WithdrawAttributes> {
	@Column({ primaryKey: true })
	id!: string
	@Column({ type: DataType.FLOAT })
	requestAmount!: number
	@Column
	dateOfRequest!: Date
	@Column({ type: DataType.ARRAY(DataType.STRING) })
	withdrawDocuments!: string[]
	@Column
	withdrawReason!: string
	@Column
	requestStatus!: string
	@Column
	rejectTitle!: string
	@Column
	rejectReason!: string
	@Column
	receivedDate!: Date
	@Column({ type: DataType.FLOAT })
	receivedAmount!: number
	@Column
	projectId!: number
	@Column
	projectWalletId!: string
	@Column
	userId!: string
	@Column
	userWalletId!: string
}

export default Withdraw
