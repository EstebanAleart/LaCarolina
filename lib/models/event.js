const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Event = sequelize.define('Event', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  lead_id: { type: DataTypes.UUID, allowNull: false, unique: true },
  fecha_confirmada: { type: DataTypes.DATE },
  tipo_evento: { type: DataTypes.STRING },
  invitados_estimados: { type: DataTypes.INTEGER },
  servicios_contratados: { type: DataTypes.JSON },
  estado_operativo: { type: DataTypes.STRING },
  contrato_url: { type: DataTypes.STRING },
  // C: Bloque financiero
  valor_total_evento: { type: DataTypes.FLOAT },
  estado_pago: { type: DataTypes.STRING },
  modalidad_actualizacion_precios: { type: DataTypes.STRING },
  // C: Campos del contrato firmado
  precio_senia: { type: DataTypes.FLOAT },
  adicionales: { type: DataTypes.JSON, defaultValue: [] },
  // E: Producción / menú
  menu_seleccionado: { type: DataTypes.STRING },
  minimo_tarjetas: { type: DataTypes.INTEGER },
  valor_tarjeta_adulto: { type: DataTypes.FLOAT },
  valor_tarjeta_adolescente: { type: DataTypes.FLOAT },
  valor_tarjeta_nino: { type: DataTypes.FLOAT },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'events',
  timestamps: false,
});

module.exports = Event;
