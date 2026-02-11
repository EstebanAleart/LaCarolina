const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Lead = sequelize.define('Lead', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  nombre: { type: DataTypes.STRING, allowNull: false },
  telefono: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  canal_origen: { type: DataTypes.STRING },
  tipo_evento: { type: DataTypes.STRING },
  fecha_tentativa: { type: DataTypes.DATE },
  anio_evento: { type: DataTypes.INTEGER },
  estado_actual: { type: DataTypes.STRING },
  valor_estimado: { type: DataTypes.FLOAT },
  notas: { type: DataTypes.TEXT },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'leads',
  timestamps: false,
});

module.exports = Lead;
