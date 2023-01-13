import { Optional } from 'sequelize'

import { Table, Model, Column } from 'sequelize-typescript'

import { RoadmapInterface } from '@interfaces/projects'

interface RoadmapAttributes extends Optional<RoadmapInterface, 'id'> {}

@Table({ timestamps: true })
class Roadmap extends Model<RoadmapInterface, RoadmapAttributes> {
	@Column({ primaryKey: true })
	id!: string
	@Column
	projectId!: number
	@Column
	verification!: string
	@Column
	subVerification!: string
	@Column
	status!: boolean
	@Column
	dateOfVerification!: Date
}

export default Roadmap
