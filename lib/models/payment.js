const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  event_id: { type: DataTypes.UUID, allowNull: false },
  service_id: { type: DataTypes.UUID }, // event_services.id — null = pago a nivel evento (sin asignar a servicio)
  lead_id: { type: DataTypes.UUID },
  monto: { type: DataTypes.FLOAT, allowNull: false },
  tipo: { type: DataTypes.STRING }, // seña | pago_parcial | pago_final | devolucion
  metodo_pago: { type: DataTypes.STRING }, // efectivo | transferencia | tarjeta | cheque | otro
  fecha_pago: { type: DataTypes.DATEONLY },
  estado: { type: DataTypes.STRING, defaultValue: 'pendiente' }, // pendiente | confirmado | anulado
  observacion: { type: DataTypes.TEXT },
  created_by_user_id: { type: DataTypes.UUID },
}, {
  tableName: 'payments',
  timestamps: false,
});

module.exports = Payment;
