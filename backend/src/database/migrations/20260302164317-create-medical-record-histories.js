'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('medical_record_histories', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      medical_record_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'medical_records', key: 'id' },
        onDelete: 'CASCADE',
      },
      editor_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      old_anamnesis: { type: Sequelize.TEXT, allowNull: false },
      old_diagnosis: { type: Sequelize.STRING(255), allowNull: true },
      old_prescription: { type: Sequelize.TEXT, allowNull: true },
      old_social_history: { type: Sequelize.JSONB, allowNull: true },
      edited_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('medical_record_histories');
  }
};