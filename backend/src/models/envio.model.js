import { DataTypes } from 'sequelize';
import { METODOS_ENVIO } from './enums.js';

export default (sequelize) =>
  sequelize.define(
    'Envio',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      pedidoId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      tarifaEnvioId: { type: DataTypes.INTEGER, allowNull: false },
      transportista: { type: DataTypes.STRING(100), allowNull: false },
      metodo: { type: DataTypes.ENUM(...METODOS_ENVIO), allowNull: false },
      codigoSeguimiento: { type: DataTypes.STRING(80) },
      pesoTotalG: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
      fechaEstimada: { type: DataTypes.DATEONLY },
      fechaEntrega: { type: DataTypes.DATEONLY },
    },
    { tableName: 'envios', timestamps: true, createdAt: 'creadoEn', updatedAt: false },
  );
