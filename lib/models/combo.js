const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Combo = sequelize.define('Combo', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  numero: { type: DataTypes.SMALLINT, unique: true }, // 1 | 2 | 3
  nombre: { type: DataTypes.STRING, allowNull: false },
  precio: { type: DataTypes.FLOAT },
  descripcion: { type: DataTypes.TEXT },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'combos',
  timestamps: false,
});

module.exports = Combo;
