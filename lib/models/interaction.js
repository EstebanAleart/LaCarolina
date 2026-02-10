const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Interaction = sequelize.define('Interaction', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  lead_id: { type: DataTypes.UUID, allowNull: false },
  tipo: { type: DataTypes.STRING },
  descripcion: { type: DataTypes.TEXT },
  fecha: { type: DataTypes.DATE },
  created_by_user_id: { type: DataTypes.UUID },
}, {
  tableName: 'interactions',
  timestamps: false,
});

module.exports = Interaction;
