const { DataTypes } = require('sequelize');
const sequelize = require('./index');

// E15-08: puente evento ↔ cliente con rol. Muchos a muchos desde el día uno; hoy se usa con un
// "titular" por evento (el cliente del lead), y admite más filas si un evento tiene varios clientes.
const EventoCliente = sequelize.define('EventoCliente', {
  evento_id: { type: DataTypes.UUID, primaryKey: true },
  cliente_id: { type: DataTypes.UUID, primaryKey: true },
  rol: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'titular' }, // titular | contacto | pagador
}, {
  tableName: 'evento_clientes',
  timestamps: false,
});

module.exports = EventoCliente;
