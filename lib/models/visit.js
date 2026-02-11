const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Visit = sequelize.define('Visit', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  lead_id: { type: DataTypes.UUID, allowNull: false },
  fecha_visita: { type: DataTypes.DATE },
  resultado: { type: DataTypes.STRING },
  notas: { type: DataTypes.TEXT },
  created_by_user_id: { type: DataTypes.UUID },
}, {
  tableName: 'visits',
  timestamps: false,
});

module.exports = Visit;
