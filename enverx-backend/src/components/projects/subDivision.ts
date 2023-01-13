import { Optional } from 'sequelize'
import { Table, Model, Column } from 'sequelize-typescript'

import { DistrictsInterface } from '@interfaces/projects'

interface DistrictsAttributes extends Optional<DistrictsInterface, 'id'> {}

@Table({ timestamps: true })
class Districts extends Model<DistrictsInterface, DistrictsAttributes> {
	@Column
	country!: string
	@Column
	districtCode!: string
	@Column
	district!: string
}

export default Districts
