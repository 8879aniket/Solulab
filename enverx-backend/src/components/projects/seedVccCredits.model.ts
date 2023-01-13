import { Optional } from 'sequelize'
import { Table, Model, Column, DataType } from 'sequelize-typescript'
import { SeedVccCreditsInterface } from '@interfaces/projects'

interface seedVccCreditsAttributes extends Optional<SeedVccCreditsInterface, 'id'> {}

@Table({ timestamps: true })
class SeedVccCredits extends Model<SeedVccCreditsInterface, seedVccCreditsAttributes> {
	@Column({ primaryKey: true })
	id!: string

	@Column
	serialNumber!: string

	@Column
	quantityIssued!: number

	@Column({ type: DataType.ARRAY(DataType.STRING) })
	additionalCertificates!: string[]

	@Column({ allowNull: false })
	projectId!: number

	@Column
	projectTokenId!: string

	@Column({ type: DataType.DECIMAL })
	gasFees!: number

	@Column
	transactionHash!: string

	@Column
	userWallet!: string
}

export default SeedVccCredits
