'use strict';
const crypto = require('crypto');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('roles', [
      {
        id: crypto.randomUUID(),
        name: 'LAB_TECHNICIAN',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: crypto.randomUUID(),
        name: 'PATIENT',
        created_at: new Date(),
        updated_at: new Date(),
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', {
      name: {
        [Sequelize.Op.in]: ['LAB_TECHNICIAN', 'PATIENT']
      }
    }, {});
  }
};