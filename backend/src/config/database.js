require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'ehr_database',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5433,
    dialect: 'postgres',
  },
  
};