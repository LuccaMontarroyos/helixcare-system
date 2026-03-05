'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('patients', 'insurance_provider', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn('patients', 'insurance_number', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('patients', 'insurance_provider');
    await queryInterface.removeColumn('patients', 'insurance_number');
  }
};