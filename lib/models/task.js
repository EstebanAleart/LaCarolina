const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Task = sequelize.define('Task', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  titulo: { type: DataTypes.STRING, allowNull: false },
  descripcion: { type: DataTypes.TEXT },
  lead_id: { type: DataTypes.INTEGER, allowNull: true },
  evento_id: { type: DataTypes.INTEGER, allowNull: true },
  assigned_to_user_id: { type: DataTypes.INTEGER },
  estado: { type: DataTypes.STRING },
  prioridad: { type: DataTypes.STRING },
  due_date: { type: DataTypes.DATE },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'tasks',
  timestamps: false,
});

module.exports = Task;
