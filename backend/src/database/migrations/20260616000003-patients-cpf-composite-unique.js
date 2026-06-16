'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Drop the global unique constraint on cpf (name may vary; try both common names)
    await queryInterface.sequelize
      .query(`ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_cpf_key`)
      .catch(() => {});

    // Add composite unique: same CPF can exist in different clinics, not within the same clinic
    await queryInterface.addConstraint('patients', {
      fields: ['clinic_id', 'cpf'],
      type: 'unique',
      name: 'uq_patients_clinic_cpf',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint('patients', 'uq_patients_clinic_cpf').catch(() => {});

    await queryInterface.addConstraint('patients', {
      fields: ['cpf'],
      type: 'unique',
      name: 'patients_cpf_key',
    });
  },
};
