const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const User = sequelize.define('User', {
  id: { 
    type: DataTypes.UUID, 
    primaryKey: true, 
    defaultValue: DataTypes.UUIDV4 
  },
  nombre: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  email: { 
    type: DataTypes.STRING, 
    allowNull: false, 
    unique: true 
  },
  password_hash: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  rol: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Comercial',
    validate: {
      isIn: [['Admin', 'Comercial', 'Operaciones', 'Viewer']]
    }
  },
  activo: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: true 
  },
  ultimo_acceso: {
    type: DataTypes.DATE,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = User;
