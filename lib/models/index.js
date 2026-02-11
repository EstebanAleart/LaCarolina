const { Sequelize } = require('sequelize');
require('dotenv').config();

const isSSL = (process.env.DATABASE_URL || '').includes('supabase.com');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  ...(isSSL && {
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
    },
  }),
});

module.exports = sequelize;