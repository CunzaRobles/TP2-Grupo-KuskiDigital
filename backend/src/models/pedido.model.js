import { DataTypes } from 'sequelize';
import { ESTADOS_PEDIDO } from './enums.js';

export default (sequelize) =>
  sequelize.define(
    'Pedido',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      codigo: { type: DataTypes.STRING(20), allowNull: false, unique: true },
      usuarioId: { type: DataTypes.INTEGER, allowNull: false },
      estado: {
        type: DataTypes.ENUM(...ESTADOS_PEDIDO),
        allowNull: false,
        defaultValue: 'pendiente',
      },
      // Moneda y tipo de cambio congelados al momento de la compra
      moneda: { type: DataTypes.CHAR(3), allowNull: false },
      tipoCambio: { type: DataTypes.DECIMAL(10, 4), allowNull: false },
      subtotalPen: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      costoEnvioPen: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      igvPen: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      totalPen: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      totalMoneda: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      // Snapshot de la dirección de envío
      envioDestinatario: { type: DataTypes.STRING(150), allowNull: false },
      envioPaisCodigo: { type: DataTypes.CHAR(2), allowNull: false },
      envioCiudad: { type: DataTypes.STRING(100), allowNull: false },
      envioDireccion: { type: DataTypes.STRING(255), allowNull: false },
      envioCodigoPostal: { type: DataTypes.STRING(20) },
      envioTelefono: { type: DataTypes.STRING(20) },
    },
    {
      tableName: 'pedidos',
      timestamps: true,
      createdAt: 'creadoEn',
      updatedAt: 'actualizadoEn',
    },
  );
