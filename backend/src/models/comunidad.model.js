import { DataTypes } from 'sequelize';

export default (sequelize) =>
  sequelize.define(
    'Comunidad',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(150), allowNull: false, unique: true },
      razonSocial: { type: DataTypes.STRING(150) },
      region: { type: DataTypes.STRING(100), allowNull: false, defaultValue: 'Cusco' },
      provincia: { type: DataTypes.STRING(100) },
      altitudMsnm: { type: DataTypes.INTEGER, validate: { min: 0, max: 6000 } },
      latitud: { type: DataTypes.DECIMAL(9, 6), validate: { min: -90, max: 90 } },
      longitud: { type: DataTypes.DECIMAL(9, 6), validate: { min: -180, max: 180 } },
      familiasBeneficiadas: { type: DataTypes.INTEGER, validate: { min: 0 } },
      descripcion: { type: DataTypes.TEXT },
      imagenUrl: { type: DataTypes.STRING(500) },
    },
    { tableName: 'comunidades', timestamps: false },
  );
