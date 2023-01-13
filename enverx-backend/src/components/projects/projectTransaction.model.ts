import { Optional, DataTypes } from 'sequelize'

import {
	Table,
	Model,
	Column,
	AfterUpdate,
	AfterCreate,
	DataType,
	ForeignKey,
	BelongsTo,
} from 'sequelize-typescript'

import { ProjectTransactionInterface } from '@interfaces/projects'

interface ProjectTransactionAttributes extends Optional<ProjectTransactionInterface, 'id'> {}

@Table({ timestamps: true })
class ProjectTransaction extends Model<ProjectTransactionInterface, ProjectTransactionAttributes> {
	@Column({ primaryKey: true })
	id!: string
	@Column({ unique: true })
	transactionHash!: string
	@Column
	tokenId!: string
	@Column
	projectId!: number
	@Column
	amount!: number
	@Column
	projectStartDate!: Date
	@Column
	projectEndDate!: Date
	@Column({ type: DataType.BIGINT })
	projectLength!: number
	@Column
	uri!: string
	@Column
	userId!: string
}

export default ProjectTransaction
