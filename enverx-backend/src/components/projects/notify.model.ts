import { Optional } from 'sequelize'
import { Table, Model, Column, BelongsTo, ForeignKey } from 'sequelize-typescript'

import { NotifyInterface } from '@interfaces/projects'
import Projects from '@projects/projects.model'

interface NotifyAttributes extends Optional<NotifyInterface, 'id'> {}

@Table({ timestamps: true })
class Notify extends Model<NotifyInterface, NotifyAttributes> {
	@Column({ primaryKey: true })
	id!: string

	@Column({ allowNull: false })
	userId!: string

	@Column({ defaultValue: false })
	isInvested!: boolean

	@ForeignKey(() => Projects)
	@Column
	projectId!: number

	@BelongsTo(() => Projects)
	projects!: Projects[]
}

export default Notify
