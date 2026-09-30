import { DataTypes } from 'sequelize';

export default (sequelize) =>
  sequelize.define(
    'Categoria',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
      descripcion: { type: DataTypes.TEXT },
      imagenUrl: { type: DataTypes.STRING(500) },
      orden: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
    },
    { tableName: 'categorias', timestamps: false },
  );
