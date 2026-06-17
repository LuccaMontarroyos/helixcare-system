'use strict';

// Fixed UUID for the default clinic used during the pre-production backfill.
// This same UUID is used in the default-clinic seeder.
const DEFAULT_CLINIC_ID = '00000000-0000-0000-0000-000000000001';

const SCOPED_TABLES = [
  'patients',
  'users',
  'appointments',
  'medical_records',
  'medical_record_histories',
  'exams',
  'invoices',
  'price_catalog',
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Ensure the default clinic exists before adding the FK
    const [rows] = await queryInterface.sequelize.query(
      `SELECT id FROM clinics WHERE id = '${DEFAULT_CLINIC_ID}'`,
    );
    if (rows.length === 0) {
      await queryInterface.sequelize.query(
        `INSERT INTO clinics (id, name, is_active, created_at, updated_at)
         VALUES ('${DEFAULT_CLINIC_ID}', 'Clínica Padrão', true, NOW(), NOW())`,
      );
    }

    for (const table of SCOPED_TABLES) {
      // 1. Add nullable column
      await queryInterface.addColumn(table, 'clinic_id', {
        type: Sequelize.UUID,
        allowNull: true,
      });

      // 2. Backfill all existing rows to the default clinic
      await queryInterface.sequelize.query(
        `UPDATE "${table}" SET clinic_id = '${DEFAULT_CLINIC_ID}' WHERE clinic_id IS NULL`,
      );

      // 3. Set NOT NULL now that every row has a value
      await queryInterface.changeColumn(table, 'clinic_id', {
        type: Sequelize.UUID,
        allowNull: false,
      });

      // 4. Add FK constraint
      await queryInterface.addConstraint(table, {
        fields: ['clinic_id'],
        type: 'foreign key',
        name: `fk_${table}_clinic_id`,
        references: { table: 'clinics', field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      });

      // 5. Add index
      await queryInterface.addIndex(table, ['clinic_id'], {
        name: `idx_${table}_clinic_id`,
      });
    }
  },

  async down(queryInterface) {
    for (const table of SCOPED_TABLES) {
      await queryInterface.removeIndex(table, `idx_${table}_clinic_id`).catch(() => {});
      await queryInterface.removeConstraint(table, `fk_${table}_clinic_id`).catch(() => {});
      await queryInterface.removeColumn(table, 'clinic_id');
    }
  },
};
