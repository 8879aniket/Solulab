import { Optional } from 'sequelize'

import { Table, Model, Column, AfterUpdate, AfterCreate, DataType } from 'sequelize-typescript'

import { NotificationInterface } from '@interfaces/notification'

interface NotificationAttributes extends Optional<NotificationInterface, 'id'> {}

@Table({ timestamps: true })
class Notification extends Model<NotificationInterface, NotificationAttributes> {
	@Column({ primaryKey: true })
	id!: string
	@Column
	title!: string
	@Column
	body!: string
	@Column
	redirectionId!: string
	@Column
	notificationType!: string
	@Column({ defaultValue: false })
	isRead!: boolean
	@Column
	userId!: string

	//! REFERENCE FOR ASSOCIATION
	/* @HasMany(() => Projects, 'userId')
    projects!: Projects[]

    @HasMany(() => Order, 'userId')
    orderId!: number */

	// HOOKS
	// @AfterUpdate
	// static updateDummyModel(instance: Notification) {
	//     afterUpdateHooks(instance)
	// }

	// @AfterCreate
	// static beforeCreateDummyModel(instance: User) {
	//     afterCreateHooks(instance)
	// }
}

export default Notification
