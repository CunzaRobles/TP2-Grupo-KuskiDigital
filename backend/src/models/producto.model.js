import { DataTypes } from 'sequelize';

export default (sequelize) =>
  sequelize.define(
    'Producto',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      sku: { type: DataTypes.STRING(30), allowNull: false, unique: true },
      nombre: { type: DataTypes.STRING(150), allowNull: false },
      slug: { type: DataTypes.STRING(170), allowNull: false, unique: true },
      descripcion: { type: DataTypes.TEXT },
      precioBasePen: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0.01 },
      },
      stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
      stockMinimo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
        validate: { min: 0 },
      },
      pesoG: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
      destacado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      categoriaId: { type: DataTypes.INTEGER, allowNull: false },
      comunidadId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: 'productos',
      timestamps: true,
      createdAt: 'creadoEn',
      updatedAt: 'actualizadoEn',
    },
  );
