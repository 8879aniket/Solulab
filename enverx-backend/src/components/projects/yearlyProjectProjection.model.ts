import { Optional, DataTypes } from 'sequelize'

import { Table, Model, Column, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript'

import { YearlyProjectProjectionInterface } from '@interfaces/projects'
import Projects from '@projects/projects.model'

interface YearlyProjectProjectionAttributes
	extends Optional<YearlyProjectProjectionInterface, 'id'> {}

@Table({ timestamps: true })
class YearlyProjectProjection extends Model<
	YearlyProjectProjectionInterface,
	YearlyProjectProjectionAttributes
> {
	@Column({ primaryKey: true })
	id!: string
	@Column({ type: DataType.BIGINT })
	projected_credits!: number
	@Column
	year!: Date
	@Column({ defaultValue: 0 })
	sold!: number
	@Column({ defaultValue: 0 })
	realised!: number
	@Column
	fullYear!: number
	@Column({ defaultValue: 0 })
	credit_retired!: number
	@Column({ defaultValue: 0 })
	vcc_issued!: number
	@ForeignKey(() => Projects)
	@Column
	projectId!: number

	@BelongsTo(() => Projects)
	projects!: Projects[]
}

export default YearlyProjectProjection
