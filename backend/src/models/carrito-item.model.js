import { DataTypes } from 'sequelize';

export default (sequelize) =>
  sequelize.define(
    'CarritoItem',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      carritoId: { type: DataTypes.INTEGER, allowNull: false },
      productoId: { type: DataTypes.INTEGER, allowNull: false },
      cantidad: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
    },
    {
      tableName: 'carrito_items',
      timestamps: false,
      indexes: [{ unique: true, fields: ['carrito_id', 'producto_id'] }],
    },
  );
