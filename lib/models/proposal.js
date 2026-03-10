const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Proposal = sequelize.define('Proposal', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  lead_id: { type: DataTypes.UUID, allowNull: false },
  version: { type: DataTypes.INTEGER, allowNull: false },
  contenido_html: { type: DataTypes.TEXT },
  // precio_total se mantiene por compatibilidad con datos existentes
  precio_total: { type: DataTypes.FLOAT },
  // Campos de contrato
  precio_senia: { type: DataTypes.FLOAT },
  tipo_evento: { type: DataTypes.STRING },
  invitados_estimados: { type: DataTypes.INTEGER },
  valor_total_evento: { type: DataTypes.FLOAT },
  modalidad_actualizacion_precios: { type: DataTypes.STRING },
  servicios_base: { type: DataTypes.JSON, defaultValue: [] },
  adicionales: { type: DataTypes.JSON, defaultValue: [] },
  menu_seleccionado: { type: DataTypes.STRING },
  minimo_tarjetas: { type: DataTypes.INTEGER },
  valor_tarjeta_adulto: { type: DataTypes.FLOAT },
  valor_tarjeta_adolescente: { type: DataTypes.FLOAT },
  valor_tarjeta_nino: { type: DataTypes.FLOAT },
  estado: { type: DataTypes.STRING },
  fecha_envio: { type: DataTypes.DATE },
  created_by_user_id: { type: DataTypes.UUID },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'proposals',
  timestamps: false,
});

module.exports = Proposal;
