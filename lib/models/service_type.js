const { DataTypes } = require('sequelize');
const sequelize = require('./index');

// Registro parametrizable de tipos de servicio (motor genérico):
// agregar un servicio nuevo = insertar una fila, sin tocar el esquema.
const ServiceType = sequelize.define('ServiceType', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  codigo: { type: DataTypes.STRING, allowNull: false, unique: true }, // salon | catering | cotillon | ...
  nombre: { type: DataTypes.STRING, allowNull: false },
  icono: { type: DataTypes.STRING },   // nombre de ícono lucide
  color: { type: DataTypes.STRING },   // clase/color para badges
  usa_stock: { type: DataTypes.BOOLEAN, defaultValue: false },
  usa_combo: { type: DataTypes.BOOLEAN, defaultValue: false },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
  orden: { type: DataTypes.INTEGER, defaultValue: 0 },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'service_types',
  timestamps: false,
});

module.exports = ServiceType;
