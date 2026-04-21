'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('appointments', 'appointment_type', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });

    await queryInterface.addColumn('appointments', 'duration_minutes', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 30,
    });

    await queryInterface.addIndex('appointments', {
      fields: ['doctor_id', 'appointment_date', 'status'],
      name: 'idx_appointments_doctor_date_status',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('appointments', 'idx_appointments_doctor_date_status');
    await queryInterface.removeColumn('appointments', 'duration_minutes');
    await queryInterface.removeColumn('appointments', 'appointment_type');
  },
};