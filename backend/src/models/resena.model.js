import { DataTypes } from 'sequelize';

export default (sequelize) =>
  sequelize.define(
    'Resena',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      usuarioId: { type: DataTypes.INTEGER, allowNull: false },
      productoId: { type: DataTypes.INTEGER, allowNull: false },
      calificacion: { type: DataTypes.SMALLINT, allowNull: false, validate: { min: 1, max: 5 } },
      comentario: { type: DataTypes.TEXT },
    },
    {
      tableName: 'resenas',
      timestamps: true,
      createdAt: 'creadoEn',
      updatedAt: false,
      indexes: [{ unique: true, fields: ['usuario_id', 'producto_id'] }],
    },
  );
