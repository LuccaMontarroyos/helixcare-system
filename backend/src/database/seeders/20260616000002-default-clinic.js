'use strict';

// Must match the UUID used in migration 20260616000002-add-clinic-id-to-scoped-tables.js
const DEFAULT_CLINIC_ID = '00000000-0000-0000-0000-000000000001';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const existing = await queryInterface.sequelize.query(
      `SELECT id FROM clinics WHERE id = '${DEFAULT_CLINIC_ID}'`,
    );
    if (existing[0].length > 0) return;

    await queryInterface.bulkInsert('clinics', [
      {
        id: DEFAULT_CLINIC_ID,
        name: 'Clínica Padrão',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('clinics', { id: DEFAULT_CLINIC_ID }, {});
  },
};
