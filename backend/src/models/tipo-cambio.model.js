import { DataTypes } from 'sequelize';

// Soporte de la simulación del tipo de cambio: valor de 1 unidad de la moneda en soles.
export default (sequelize) =>
  sequelize.define(
    'TipoCambio',
    {
      monedaCodigo: { type: DataTypes.CHAR(3), primaryKey: true },
      simbolo: { type: DataTypes.STRING(5), allowNull: false },
      valorEnPen: { type: DataTypes.DECIMAL(10, 4), allowNull: false, validate: { min: 0.0001 } },
    },
    { tableName: 'tipos_cambio', timestamps: true, createdAt: false, updatedAt: 'actualizadoEn' },
  );
