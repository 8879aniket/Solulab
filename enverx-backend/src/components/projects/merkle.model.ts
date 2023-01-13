import { Optional } from 'sequelize'
import { Table, Model, Column } from 'sequelize-typescript'

import { MerkleInterface } from '@interfaces/projects'

interface MerkleAttributes extends Optional<MerkleInterface, 'id'> {}

@Table({ timestamps: true })
class Merkle extends Model<MerkleInterface, MerkleAttributes> {
	@Column({ primaryKey: true })
	id!: string

	@Column({ allowNull: false })
	userId!: string

	@Column
	walletAddress!: string
}

export default Merkle
