'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', {
      name: 'PATIENT'
    }, {});
  },

  async down(queryInterface, Sequelize) {
    const crypto = require('crypto');
    await queryInterface.bulkInsert('roles', [
      {
        id: crypto.randomUUID(),
        name: 'PATIENT',
        created_at: new Date(),
        updated_at: new Date(),
      }
    ], {});
  }
};