import { DataTypes } from 'sequelize';

// Tabla puente N:M productos ↔ certificaciones (PK compuesta, sin id propio).
export default (sequelize) =>
  sequelize.define(
    'ProductoCertificacion',
    {
      productoId: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
      certificacionId: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    },
    { tableName: 'producto_certificaciones', timestamps: false },
  );
