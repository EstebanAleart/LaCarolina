const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const ComboProduct = sequelize.define('ComboProduct', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  combo_id: { type: DataTypes.UUID, allowNull: false },
  product_id: { type: DataTypes.UUID, allowNull: false },
  cantidad: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'combo_products',
  timestamps: false,
});

module.exports = ComboProduct;
