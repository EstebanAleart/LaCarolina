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
  tipo_cliente: { type: DataTypes.STRING },
  fecha_visita_salon: { type: DataTypes.DATE },
  fecha_firma_contrato: { type: DataTypes.DATE },
  fecha_limite_pago_total: { type: DataTypes.DATE },
  valor_estimado: { type: DataTypes.FLOAT },
  invitados_estimados: { type: DataTypes.INTEGER },
  notas: { type: DataTypes.TEXT },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'leads',
  timestamps: false,
});

module.exports = Lead;
