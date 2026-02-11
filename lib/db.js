const sequelize = require('./models/index');
const models = require('./models/associations');

// Exportar sequelize y todos los modelos
module.exports = {
  sequelize,
  ...models, // Esto expande: User, Lead, CalendarDate, Proposal, Event, etc.
};