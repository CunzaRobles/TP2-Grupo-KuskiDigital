import { DataTypes } from 'sequelize';

// subtotal_pen es una columna GENERATED ALWAYS en PostgreSQL: se lee, pero nunca se escribe.
const sinSubtotal = (options) => {
  if (options.fields) options.fields = options.fields.filter((f) => f !== 'subtotalPen');
};

export default (sequelize) =>
  sequelize.define(
    'PedidoItem',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      pedidoId: { type: DataTypes.INTEGER, allowNull: false },
      productoId: { type: DataTypes.INTEGER, allowNull: false },
      nombreProducto: { type: DataTypes.STRING(150), allowNull: false },
      cantidad: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
      precioUnitarioPen: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      subtotalPen: { type: DataTypes.DECIMAL(12, 2) },
    },
    {
      tableName: 'pedido_items',
      timestamps: false,
      indexes: [{ unique: true, fields: ['pedido_id', 'producto_id'] }],
      hooks: {
        beforeSave: (_item, options) => sinSubtotal(options),
        beforeBulkCreate: (_items, options) => sinSubtotal(options),
      },
    },
  );
