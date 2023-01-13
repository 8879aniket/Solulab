import { Optional } from 'sequelize'
import { Table, Model, Column } from 'sequelize-typescript'

import { BlockchainProofInterface } from '@interfaces/projects'

interface BlockchainProofAttributes extends Optional<BlockchainProofInterface, 'id'> {}

@Table({ timestamps: true })
class BlockchainProof extends Model<BlockchainProofInterface, BlockchainProofAttributes> {
	@Column({ primaryKey: true })
	id!: string

	@Column({ defaultValue: 0 })
	previousLength!: number
	@Column
	merkleRoot!: string
	@Column
	merkleProof!: string
}

export default BlockchainProof
