import { DataTypes } from 'sequelize';
import {
  BIENES_CONTRATADOS,
  ESTADOS_RECLAMACION,
  TIPOS_DOCUMENTO,
  TIPOS_RECLAMACION,
} from './enums.js';

// Hoja del Libro de Reclamaciones virtual (tabla creada por la migración
// 20261124000000-reclamaciones, no por el baseline).
export default (sequelize) =>
  sequelize.define(
    'Reclamacion',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      codigo: { type: DataTypes.STRING(20), allowNull: false, unique: true },
      tipo: { type: DataTypes.ENUM(...TIPOS_RECLAMACION), allowNull: false },
      estado: {
        type: DataTypes.ENUM(...ESTADOS_RECLAMACION),
        allowNull: false,
        defaultValue: 'recibido',
      },
      nombre: { type: DataTypes.STRING(150), allowNull: false },
      tipoDocumento: { type: DataTypes.ENUM(...TIPOS_DOCUMENTO), allowNull: false },
      numeroDocumento: { type: DataTypes.STRING(20), allowNull: false },
      domicilio: { type: DataTypes.STRING(255), allowNull: false },
      telefono: { type: DataTypes.STRING(20), allowNull: false },
      correo: { type: DataTypes.STRING(150), allowNull: false },
      menorDeEdad: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      apoderadoNombre: { type: DataTypes.STRING(150) },
      bienContratado: { type: DataTypes.ENUM(...BIENES_CONTRATADOS), allowNull: false },
      pedidoCodigo: { type: DataTypes.STRING(20) },
      montoReclamado: { type: DataTypes.DECIMAL(12, 2) },
      descripcion: { type: DataTypes.STRING(500), allowNull: false },
      detalle: { type: DataTypes.TEXT, allowNull: false },
      pedidoConsumidor: { type: DataTypes.TEXT, allowNull: false },
      respuesta: { type: DataTypes.TEXT },
      respondidoPor: { type: DataTypes.INTEGER },
      fechaRespuesta: { type: DataTypes.DATE },
      fechaLimite: { type: DataTypes.DATEONLY, allowNull: false },
    },
    {
      tableName: 'reclamaciones',
      timestamps: true,
      createdAt: 'creadoEn',
      updatedAt: 'actualizadoEn',
    },
  );
