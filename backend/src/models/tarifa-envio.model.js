import { DataTypes } from 'sequelize';
import { METODOS_ENVIO, ZONAS_ENVIO } from './enums.js';

// Soporte de la simulación de envío: costo = costoBasePen + costoPorKgPen * kg.
export default (sequelize) =>
  sequelize.define(
    'TarifaEnvio',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      zona: { type: DataTypes.ENUM(...ZONAS_ENVIO), allowNull: false },
      metodo: { type: DataTypes.ENUM(...METODOS_ENVIO), allowNull: false },
      transportista: { type: DataTypes.STRING(100), allowNull: false },
      costoBasePen: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
      costoPorKgPen: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
      diasMin: { type: DataTypes.SMALLINT, allowNull: false, validate: { min: 1 } },
      diasMax: { type: DataTypes.SMALLINT, allowNull: false },
    },
    {
      tableName: 'tarifas_envio',
      timestamps: false,
      indexes: [{ unique: true, fields: ['zona', 'metodo'] }],
    },
  );
