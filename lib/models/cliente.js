const { DataTypes } = require('sequelize');
const sequelize = require('./index');

// E15-08: el Cliente es la persona/empresa, permanente. Un cliente tiene muchos leads (una consulta
// por fiesta) y participa en muchos eventos (tabla puente evento_clientes, con rol).
const Cliente = sequelize.define('Cliente', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  nombre: { type: DataTypes.STRING, allowNull: false },
  telefono: { type: DataTypes.STRING(50) },
  telefono_norm: { type: DataTypes.STRING(50) }, // solo dígitos, para deduplicar
  email: { type: DataTypes.STRING },
  dni: { type: DataTypes.STRING(30) },
  direccion: { type: DataTypes.TEXT },
  tipo_cliente: { type: DataTypes.STRING(50), defaultValue: 'Particular' },
  notas: { type: DataTypes.TEXT },
  lead_origen_id: { type: DataTypes.UUID }, // primer lead que lo creó (trazabilidad del backfill)
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'clientes',
  timestamps: false,
});

module.exports = Cliente;
