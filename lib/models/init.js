const sequelize = require('./index');
const models = require('./associations');

async function initModels() {
  // ponytail: el esquema lo aplica el dueño con los .sql de /migrations.
  // El auto-migrate (ALTER + sync alter:true) solo corre si DB_AUTO_MIGRATE=true,
  // para no tocar la DB solo al arrancar. En prod queda apagado siempre.
  if (process.env.DB_AUTO_MIGRATE !== 'true') {
    console.log('DB_AUTO_MIGRATE off — esquema asumido (aplicado por migraciones manuales)');
    return;
  }

  // Fix: convertir columna rol de enum a varchar si es necesario
  try {
    await sequelize.query(`
      ALTER TABLE users ALTER COLUMN rol TYPE VARCHAR(255) USING rol::text;
    `);
    await sequelize.query(`DROP TYPE IF EXISTS "enum_users_rol";`);
  } catch (e) {
    // Ignorar si ya es varchar o la tabla no existe
  }

  await sequelize.sync({ alter: true });
  console.log('All models synchronized');
}

module.exports = { ...models, initModels };
