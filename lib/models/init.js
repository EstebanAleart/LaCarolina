const sequelize = require('./index');
const models = require('./associations');

async function initModels() {
  // Fix: convertir columna rol de enum a varchar si es necesario
  try {
    await sequelize.query(`
      ALTER TABLE users ALTER COLUMN rol TYPE VARCHAR(255) USING rol::text;
    `);
    await sequelize.query(`DROP TYPE IF EXISTS "enum_users_rol";`);
  } catch (e) {
    // Ignorar si ya es varchar o la tabla no existe
  }

  await sequelize.sync({ alter: true }); // Use alter for dev, switch to force: false for prod
  console.log('All models synchronized');
}

module.exports = { ...models, initModels };
