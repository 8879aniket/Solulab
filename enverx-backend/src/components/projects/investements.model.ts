import { Optional } from 'sequelize'

import { Table, Model, Column, DataType } from 'sequelize-typescript'

import { InvestmentsInterface } from '@interfaces/projects'

interface InvestmentsAttributes extends Optional<InvestmentsInterface, 'id'> {}

@Table({ timestamps: true })
class Investments extends Model<InvestmentsInterface, InvestmentsAttributes> {
	@Column({ primaryKey: true })
	id!: string
	@Column
	year!: number
	@Column
	month!: string
	@Column({ type: DataType.FLOAT })
	amountRaised!: number
}

export default Investments
