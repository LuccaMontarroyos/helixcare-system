'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('invoices', 'payment_provider', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'Gateway de pagamento usado no checkout',
    });

    await queryInterface.addColumn('invoices', 'provider_checkout_session_id', {
      type: Sequelize.STRING(120),
      allowNull: true,
      comment: 'ID da sessao/transacao no gateway',
    });

    await queryInterface.addColumn('invoices', 'checkout_url', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'URL de checkout para pagamento pelo paciente/pagador',
    });

    await queryInterface.addColumn('invoices', 'provider_payment_id', {
      type: Sequelize.STRING(120),
      allowNull: true,
      comment: 'ID final de pagamento confirmado pelo gateway',
    });

    await queryInterface.addIndex('invoices', ['payment_provider', 'provider_checkout_session_id'], {
      name: 'idx_invoices_provider_session',
    });

    await queryInterface.addIndex('invoices', ['provider_payment_id'], {
      name: 'idx_invoices_provider_payment_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('invoices', 'idx_invoices_provider_payment_id');
    await queryInterface.removeIndex('invoices', 'idx_invoices_provider_session');

    await queryInterface.removeColumn('invoices', 'provider_payment_id');
    await queryInterface.removeColumn('invoices', 'checkout_url');
    await queryInterface.removeColumn('invoices', 'provider_checkout_session_id');
    await queryInterface.removeColumn('invoices', 'payment_provider');
  },
};
