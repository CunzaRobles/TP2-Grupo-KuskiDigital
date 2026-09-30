import { DataTypes } from 'sequelize';

export default (sequelize) =>
  sequelize.define(
    'Certificacion',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      entidadEmisora: { type: DataTypes.STRING(150) },
    },
    { tableName: 'certificaciones', timestamps: false },
  );
