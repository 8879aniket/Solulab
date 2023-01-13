import { Optional } from 'sequelize'
import { Table, Model, Column } from 'sequelize-typescript'

import { CountriesInterface } from '@interfaces/projects'

interface CountriesAttributes extends Optional<CountriesInterface, 'id'> {}

@Table({ timestamps: true })
class Countries extends Model<CountriesInterface, CountriesAttributes> {
	@Column
	country!: string
	@Column
	code!: string
	@Column({ defaultValue: false })
	circle!: boolean
}

export default Countries
