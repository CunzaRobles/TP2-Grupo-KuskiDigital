import { DataTypes } from 'sequelize';
import { ROLES_USUARIO } from './enums.js';

export default (sequelize) =>
  sequelize.define(
    'Usuario',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(100), allowNull: false },
      apellido: { type: DataTypes.STRING(100), allowNull: false },
      correo: { type: DataTypes.STRING(150), allowNull: false, unique: true },
      passwordHash: { type: DataTypes.STRING(255), allowNull: false },
      telefono: { type: DataTypes.STRING(20) },
      paisCodigo: { type: DataTypes.CHAR(2), allowNull: false, defaultValue: 'PE' },
      idiomaPreferido: {
        type: DataTypes.CHAR(2),
        allowNull: false,
        defaultValue: 'es',
        validate: { isIn: [['es', 'en', 'de']] },
      },
      monedaPreferida: { type: DataTypes.CHAR(3), allowNull: false, defaultValue: 'PEN' },
      rol: { type: DataTypes.ENUM(...ROLES_USUARIO), allowNull: false, defaultValue: 'cliente' },
      activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      tableName: 'usuarios',
      timestamps: true,
      createdAt: 'creadoEn',
      updatedAt: 'actualizadoEn',
      defaultScope: { attributes: { exclude: ['passwordHash'] } },
      scopes: { conPassword: { attributes: { include: ['passwordHash'] } } },
    },
  );
