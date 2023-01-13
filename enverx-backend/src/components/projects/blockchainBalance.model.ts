import { Optional, DataTypes } from 'sequelize'

import { Table, Model, Column, DataType, BelongsTo, ForeignKey } from 'sequelize-typescript'

import { BlockchainBalanceInterface } from '@interfaces/projects'
import Projects from '@projects/projects.model'

interface BlockchainBalanceAttributes extends Optional<BlockchainBalanceInterface, 'id'> {}

@Table({ timestamps: true })
class BlockchainBalance extends Model<BlockchainBalanceInterface, BlockchainBalanceAttributes> {
	@Column({ primaryKey: true })
	id!: string
	@Column
	transactionHash!: string
	@Column
	tokenId!: string
	@ForeignKey(() => Projects)
	@Column
	projectId!: number
	@Column
	projectName!: string
	@Column
	userId!: string
	@Column
	userName!: string
	@Column
	noOfGTPToken!: number
	@Column
	noOfVCCToken!: number
	@Column({ type: DataType.ARRAY(DataType.STRING) })
	vccTokenId!: string[]

	@BelongsTo(() => Projects)
	project!: Projects[]
}

export default BlockchainBalance
