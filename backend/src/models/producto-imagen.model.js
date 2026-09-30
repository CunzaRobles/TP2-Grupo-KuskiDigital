import { DataTypes } from 'sequelize';

export default (sequelize) =>
  sequelize.define(
    'ProductoImagen',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      productoId: { type: DataTypes.INTEGER, allowNull: false },
      url: { type: DataTypes.STRING(500), allowNull: false },
      textoAlt: { type: DataTypes.STRING(200) },
      orden: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
      esPrincipal: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { tableName: 'producto_imagenes', timestamps: false },
  );
