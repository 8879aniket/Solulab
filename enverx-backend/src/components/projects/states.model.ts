import { Optional } from 'sequelize'
import { Table, Model, Column } from 'sequelize-typescript'

import { StatesInterface } from '@interfaces/projects'

interface StatesAttributes extends Optional<StatesInterface, 'id'> {}

@Table({ timestamps: true })
class States extends Model<StatesInterface, StatesAttributes> {
	@Column
	countryCode!: string
	@Column
	stateCode!: string
	@Column
	state!: string
}

export default States
