import { DataTypes } from 'sequelize';

export default (sequelize) =>
  sequelize.define(
    'Carrito',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      usuarioId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    },
    {
      tableName: 'carritos',
      timestamps: true,
      createdAt: 'creadoEn',
      updatedAt: 'actualizadoEn',
    },
  );
