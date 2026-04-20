'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('appointments', 'rescheduled_from_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'appointments', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('appointments', 'rescheduled_from_id');
  },
};