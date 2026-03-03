'use strict';
const crypto = require('crypto');
const argon2 = require('argon2');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const roles = await queryInterface.sequelize.query(
      `SELECT id, name FROM roles;`, { type: Sequelize.QueryTypes.SELECT }
    );

    const getRoleId = (roleName) => roles.find(r => r.name === roleName)?.id;

    const defaultPasswordHash = await argon2.hash('Senha123!');

    const users = [
      {
        id: crypto.randomUUID(),
        name: 'Administrador Geral',
        email: 'admin@helixcare.com',
        password_hash: defaultPasswordHash,
        role_id: getRoleId('ADMIN'),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: crypto.randomUUID(),
        name: 'Dra. Ana (Cardiologista)',
        email: 'medica@helixcare.com',
        password_hash: defaultPasswordHash,
        role_id: getRoleId('DOCTOR'),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: crypto.randomUUID(),
        name: 'Carlos (Recepção)',
        email: 'recepcao@helixcare.com',
        password_hash: defaultPasswordHash,
        role_id: getRoleId('RECEPTIONIST'),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: crypto.randomUUID(),
        name: 'Pedro (Laboratório)',
        email: 'lab@helixcare.com',
        password_hash: defaultPasswordHash,
        role_id: getRoleId('LAB_TECHNICIAN'),
        created_at: new Date(),
        updated_at: new Date(),
      }
    ];

    const existingUsers = await queryInterface.sequelize.query(
      `SELECT email FROM users;`, { type: Sequelize.QueryTypes.SELECT }
    );
    const usersToInsert = users.filter(u => !existingUsers.some(eu => eu.email === u.email));

    if (usersToInsert.length > 0) {
      await queryInterface.bulkInsert('users', usersToInsert, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      email: {
        [Sequelize.Op.in]: [
          'admin@helixcare.com', 
          'medica@helixcare.com', 
          'recepcao@helixcare.com', 
          'lab@helixcare.com'
        ]
      }
    }, {});
  }
};