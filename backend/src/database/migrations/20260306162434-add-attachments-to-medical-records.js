'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('medical_records', 'attachments', {
      type: Sequelize.ARRAY(Sequelize.STRING(500)), 
      allowNull: true,
      defaultValue: [],
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('medical_records', 'attachments');
  }
};