import { DataTypes } from 'sequelize';
import { ESTADOS_PEDIDO } from './enums.js';

// Historial de estados del pedido: alimenta el tracking visual.
export default (sequelize) =>
  sequelize.define(
    'PedidoEstado',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      pedidoId: { type: DataTypes.INTEGER, allowNull: false },
      estado: { type: DataTypes.ENUM(...ESTADOS_PEDIDO), allowNull: false },
      comentario: { type: DataTypes.STRING(255) },
      usuarioId: { type: DataTypes.INTEGER },
    },
    { tableName: 'pedido_estados', timestamps: true, createdAt: 'creadoEn', updatedAt: false },
  );
