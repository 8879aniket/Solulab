'use strict'

module.exports = {
	async up(queryInterface, Sequelize) {
		/**
		 * Add altering commands here.
		 *
		 * Example:
		 * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
		 */
		// await queryInterface.changeColumn('Projects', 'aliasName', {
		// 	type: Sequelize.STRING,
		// 	defaultValue: 'test',
		// })
		// await queryInterface.removeColumn('Projects', 'other_docs')
		/* await queryInterface.addColumn('Projects', 'other_docs', {
			type: DataTypes.ARRAY(DataTypes.STRING),
		}) */
	},

	async down(queryInterface, Sequelize) {
		/**
		 * Add reverting commands here.
		 *
		 * Example:
		 * await queryInterface.dropTable('users');
		 */
		await queryInterface.dropTable('SequelizeMeta')
	},
}
