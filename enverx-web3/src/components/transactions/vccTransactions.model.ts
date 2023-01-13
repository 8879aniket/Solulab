import { Optional, DataTypes } from 'sequelize'

import { Table, Model, Column, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript'

import VCCTransactionInterface from '@interfaces/vccTransaction'

interface VCCTransactionAttributes extends Optional<VCCTransactionInterface, 'id'> {}

@Table({ timestamps: true })
class VCCTransaction extends Model<VCCTransactionInterface, VCCTransactionAttributes> {
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
	@Column
	startIndex!: string
}

export default VCCTransaction
