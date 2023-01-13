import { Optional, DataTypes } from 'sequelize'

import { Table, Model, Column, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript'

import TransactionInterface from '@interfaces/transaction'

interface TransactionAttributes extends Optional<TransactionInterface, 'id'> {}

@Table({ timestamps: true })
class Transaction extends Model<TransactionInterface, TransactionAttributes> {
	@Column({ primaryKey: true })
	id!: string
	@Column
	projectId!: number
	@Column
	userWalletAddress!: string
	@Column
	projectTokenId!: number
	@Column
	txHash!: string
	@Column
	fromWalletAddress!: string
	@Column
	toWalletAddress!: string
	@Column
	tokenQuantity!: number
	@Column
	eventType!: string
	@Column
	uri!: string
}

export default Transaction
