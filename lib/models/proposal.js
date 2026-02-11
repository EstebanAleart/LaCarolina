const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Proposal = sequelize.define('Proposal', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  lead_id: { type: DataTypes.UUID, allowNull: false },
  version: { type: DataTypes.INTEGER, allowNull: false },
  contenido_html: { type: DataTypes.TEXT },
  precio_total: { type: DataTypes.FLOAT },
  estado: { type: DataTypes.STRING },
  fecha_envio: { type: DataTypes.DATE },
  created_by_user_id: { type: DataTypes.UUID },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'proposals',
  timestamps: false,
});

module.exports = Proposal;
