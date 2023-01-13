import { Optional, DataTypes } from 'sequelize'

import {
	Table,
	Model,
	Column,
	AfterUpdate,
	AfterCreate,
	DataType,
	ForeignKey,
	BelongsTo,
} from 'sequelize-typescript'

import { TokenTransactionInterface } from '@interfaces/projects'

interface TokenTransactionAttributes extends Optional<TokenTransactionInterface, 'id'> {}

@Table({ timestamps: true })
class TokenTransactions extends Model<TokenTransactionInterface, TokenTransactionAttributes> {
	@Column({ primaryKey: true })
	id!: string
	@Column({ unique: true })
	transactionHash!: string
	@Column
	tokenId!: string
	@Column
	projectId!: number
	@Column
	tokenQuantity!: number
	@Column
	fromWalletAddress!: string
	@Column
	toWalletAddress!: string
	@Column
	eventType!: string
	@Column
	userId!: string
}

export default TokenTransactions
