const { DataTypes } = require('sequelize');
const sequelize = require('./index');

// Libro mayor de stock (append-only). cantidad va CON SIGNO.
// ingreso/reserva: +   |   egreso/liberacion: -   |   ajuste: +/-
const StockMovement = sequelize.define('StockMovement', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  product_id: { type: DataTypes.UUID, allowNull: false },
  tipo: { type: DataTypes.STRING, allowNull: false }, // ingreso | egreso | reserva | liberacion | ajuste
  cantidad: { type: DataTypes.INTEGER, allowNull: false },
  event_id: { type: DataTypes.UUID },
  combo_id: { type: DataTypes.UUID },
  observacion: { type: DataTypes.TEXT },
  created_by_user_id: { type: DataTypes.UUID },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'stock_movements',
  timestamps: false,
});

module.exports = StockMovement;
