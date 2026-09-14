const { DataTypes } = require('sequelize');
const sequelize = require('./index');

// Un servicio contratado de un evento. Cada uno administra su propia cuenta
// corriente (pagos con service_id) y su saldo, sin mezclarse con otros servicios.
const EventService = sequelize.define('EventService', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  event_id: { type: DataTypes.UUID, allowNull: false },
  service_type_id: { type: DataTypes.UUID, allowNull: false },
  estado: { type: DataTypes.STRING, defaultValue: 'Contratado' }, // Contratado | En preparación | Listo | Entregado | Cancelado
  total_contratado: { type: DataTypes.FLOAT, defaultValue: 0 },
  combo_id: { type: DataTypes.UUID }, // solo cotillón (usa_combo)
  metadata: { type: DataTypes.JSONB, defaultValue: {} }, // campos propios del servicio (ej. cantidad tarjetas)
  observaciones: { type: DataTypes.TEXT },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'event_services',
  timestamps: false,
});

module.exports = EventService;
