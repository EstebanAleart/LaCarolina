const sequelize = require('./index');
const models = require('./associations');

async function initModels() {
  await sequelize.sync({ alter: true }); // Use alter for dev, switch to force: false for prod
  console.log('All models synchronized');
}

module.exports = { ...models, initModels };
