import { DataTypes } from 'sequelize';

export default (sequelize) =>
  sequelize.define(
    'Direccion',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      usuarioId: { type: DataTypes.INTEGER, allowNull: false },
      nombreDestinatario: { type: DataTypes.STRING(150), allowNull: false },
      paisCodigo: { type: DataTypes.CHAR(2), allowNull: false },
      ciudad: { type: DataTypes.STRING(100), allowNull: false },
      direccion: { type: DataTypes.STRING(255), allowNull: false },
      codigoPostal: { type: DataTypes.STRING(20) },
      telefono: { type: DataTypes.STRING(20) },
      esPrincipal: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { tableName: 'direcciones', timestamps: true, createdAt: 'creadoEn', updatedAt: false },
  );
