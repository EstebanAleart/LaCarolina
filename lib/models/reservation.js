const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Reservation = sequelize.define('Reservation', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  lead_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  calendar_date_id: { type: DataTypes.INTEGER, allowNull: false },
  monto_senia: { type: DataTypes.FLOAT },
  fecha_pago: { type: DataTypes.DATE },
  metodo_pago: { type: DataTypes.STRING },
  comprobante_url: { type: DataTypes.STRING },
  estado: { type: DataTypes.STRING },
}, {
  tableName: 'reservations',
  timestamps: false,
});

module.exports = Reservation;
