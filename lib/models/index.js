const { Sequelize } = require('sequelize');
require('pg'); // Forzar trace para que Vercel incluya pg en la función serverless

// Solo cargar dotenv si no está ya configurado
if (!process.env.DATABASE_URL) {
  require('dotenv').config();
}

// Usar URL placeholder durante build para que .define() no crashee
// (Sequelize no conecta hasta que se ejecuta una query)
const url = process.env.DATABASE_URL || 'postgres://build:build@localhost:5432/build';
const isSSL = url.includes('supabase.com');

const sequelize = new Sequelize(url, {
  dialect: 'postgres',
  logging: false,
  ...(isSSL && {
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
    },
  }),
});

module.exports = sequelize;
