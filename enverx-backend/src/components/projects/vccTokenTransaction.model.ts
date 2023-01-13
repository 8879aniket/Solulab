import { Optional, DataTypes } from 'sequelize'

import { Table, Model, Column, DataType, BelongsTo, ForeignKey } from 'sequelize-typescript'

import { VccTokenTransactionInterface } from '@interfaces/projects'
import Projects from '@projects/projects.model'

interface VccTokenTransactionAttributes extends Optional<VccTokenTransactionInterface, 'id'> {}

@Table({ timestamps: true })
class VccTokenTransaction extends Model<
	VccTokenTransactionInterface,
	VccTokenTransactionAttributes
> {
	@Column({ primaryKey: true })
	id!: string
	@Column({ unique: true })
	transactionHash!: string
	@Column
	tokenId!: string
	@ForeignKey(() => Projects)
	@Column
	projectId!: number
	@Column
	projectTitle!: string
	@Column
	projectMethodology!: string
	@Column
	vccQuantity!: number
	@Column({ type: DataType.ARRAY(DataType.STRING) })
	vccTokenId!: string[]
	@Column
	uri!: string
	@Column
	userId!: string
	@Column
	fromWalletAddress!: string
	@Column
	toWalletAddress!: string
	@Column({ defaultValue: 'Pending' })
	transactionStatus!: string
	@Column
	retireBy!: string

	@BelongsTo(() => Projects)
	project!: Projects[]
}

export default VccTokenTransaction
