import { DataTypes } from 'sequelize';
import { TIPOS_MOVIMIENTO } from './enums.js';

// Kardex: cantidad negativa en salidas y ajustes a la baja.
export default (sequelize) =>
  sequelize.define(
    'MovimientoInventario',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      productoId: { type: DataTypes.INTEGER, allowNull: false },
      tipo: { type: DataTypes.ENUM(...TIPOS_MOVIMIENTO), allowNull: false },
      cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          distintoDeCero(value) {
            if (Number(value) === 0) throw new Error('La cantidad del movimiento no puede ser 0');
          },
        },
      },
      stockResultante: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0 } },
      motivo: { type: DataTypes.STRING(255) },
      usuarioId: { type: DataTypes.INTEGER },
      pedidoId: { type: DataTypes.INTEGER },
    },
    {
      tableName: 'movimientos_inventario',
      timestamps: true,
      createdAt: 'creadoEn',
      updatedAt: false,
    },
  );
