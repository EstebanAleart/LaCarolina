const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const LeadStatusHistory = sequelize.define('LeadStatusHistory', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  lead_id: { type: DataTypes.INTEGER, allowNull: false },
  estado_anterior: { type: DataTypes.STRING },
  estado_nuevo: { type: DataTypes.STRING },
  motivo: { type: DataTypes.STRING },
  changed_by_user_id: { type: DataTypes.INTEGER },
  changed_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'lead_status_history',
  timestamps: false,
});

module.exports = LeadStatusHistory;
