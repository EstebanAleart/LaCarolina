const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const CalendarDate = sequelize.define('CalendarDate', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  fecha: { type: DataTypes.DATEONLY, allowNull: false, unique: true },
  estado_fecha: { type: DataTypes.STRING },
  fuente: { type: DataTypes.STRING },
  lead_id: { type: DataTypes.UUID, allowNull: true },
  evento_id: { type: DataTypes.UUID, allowNull: true },
  nota: { type: DataTypes.TEXT },
  google_event_id: { type: DataTypes.STRING, allowNull: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'calendar_dates',
  timestamps: false,
});

module.exports = CalendarDate;
