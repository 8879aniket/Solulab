import { Optional } from 'sequelize'
import { Table, Model, Column, DataType } from 'sequelize-typescript'
import { PlatformAnalyticsInterface } from '@interfaces/projects'

interface PlatformAnalyticsAttributes extends Optional<PlatformAnalyticsInterface, 'id'> {}

@Table({ timestamps: true })
class PlatformAnalytics extends Model<PlatformAnalyticsInterface, PlatformAnalyticsAttributes> {
	@Column({ primaryKey: true })
	id!: string
	@Column({ type: DataType.FLOAT })
	noOfGTPSold!: number
	@Column({ type: DataType.FLOAT })
	noOfInvestors!: number
	@Column({ type: DataType.FLOAT })
	amountRaised!: number
	@Column({ type: DataType.FLOAT })
	creditsRetired!: number
	@Column({ type: DataType.DATEONLY })
	date!: Date
	@Column
	month!: string
	@Column({ type: DataType.FLOAT })
	amountToBeReaised!: number
	@Column({ type: DataType.FLOAT })
	totalGTP!: number
}

export default PlatformAnalytics
