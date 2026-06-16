'use strict';
const crypto = require('crypto');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const existing = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name = 'SUPER_ADMIN'`,
    );
    if (existing[0].length > 0) return;

    await queryInterface.bulkInsert('roles', [
      {
        id: crypto.randomUUID(),
        name: 'SUPER_ADMIN',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('roles', { name: 'SUPER_ADMIN' }, {});
  },
};
