import { DataTypes } from 'sequelize';
import { ESTADOS_PAGO, METODOS_PAGO } from './enums.js';

export default (sequelize) =>
  sequelize.define(
    'Pago',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      pedidoId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      metodo: { type: DataTypes.ENUM(...METODOS_PAGO), allowNull: false },
      estado: {
        type: DataTypes.ENUM(...ESTADOS_PAGO),
        allowNull: false,
        defaultValue: 'pendiente',
      },
      pasarela: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'simulada' },
      monto: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      moneda: { type: DataTypes.CHAR(3), allowNull: false },
      numeroOperacion: { type: DataTypes.STRING(40) },
      // Solo los 4 últimos dígitos; nunca el número completo
      tarjetaUltimos4: { type: DataTypes.CHAR(4) },
      mensajeRespuesta: { type: DataTypes.STRING(255) },
    },
    { tableName: 'pagos', timestamps: true, createdAt: 'creadoEn', updatedAt: false },
  );
