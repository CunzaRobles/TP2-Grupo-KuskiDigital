import { QueryTypes } from 'sequelize';
import { Categoria, Certificacion, Comunidad, sequelize } from '../models/index.js';

const plano = (fila) => fila.get({ plain: true });

const productosActivosDe = (columna, alias) =>
  sequelize.literal(
    `(SELECT COUNT(*)::int FROM productos p WHERE p.${columna} = "${alias}"."id" AND p.activo)`,
  );

// MIN/MAX de altitud de las comunidades que producen los productos activos de la categoría.
const altitudDeCategoria = (fn) =>
  sequelize.literal(
    `(SELECT ${fn}(c.altitud_msnm) FROM productos p
        JOIN comunidades c ON c.id = p.comunidad_id
       WHERE p.categoria_id = "Categoria"."id" AND p.activo)`,
  );

export const findCategorias = async () => {
  const filas = await Categoria.findAll({
    attributes: [
      'id',
      'nombre',
      'slug',
      'descripcion',
      'imagenUrl',
      'orden',
      [productosActivosDe('categoria_id', 'Categoria'), 'totalProductos'],
      [altitudDeCategoria('MIN'), 'altitudMin'],
      [altitudDeCategoria('MAX'), 'altitudMax'],
    ],
    order: [
      ['orden', 'ASC'],
      ['id', 'ASC'],
    ],
  });
  return filas.map(plano);
};

export const findComunidades = async () => {
  const filas = await Comunidad.findAll({
    attributes: [
      'id',
      'nombre',
      'razonSocial',
      'region',
      'provincia',
      'altitudMsnm',
      'latitud',
      'longitud',
      'familiasBeneficiadas',
      'descripcion',
      'imagenUrl',
      [productosActivosDe('comunidad_id', 'Comunidad'), 'totalProductos'],
    ],
    order: [['nombre', 'ASC']],
  });
  return filas.map(plano);
};

export const findCertificaciones = async () => {
  const filas = await Certificacion.findAll({
    attributes: ['id', 'nombre', 'entidadEmisora'],
    order: [['nombre', 'ASC']],
  });
  return filas.map(plano);
};

// Comprueba que existan la categoría, la comunidad y las certificaciones de un producto.
// → { categoria: boolean, comunidad: boolean, certificacionIds: ids que sí existen }
export const findReferencias = async ({ categoriaId, comunidadId, certificacionIds = [] }) => {
  const [categoria, comunidad, certificaciones] = await Promise.all([
    categoriaId ? Categoria.count({ where: { id: categoriaId } }) : 1,
    comunidadId ? Comunidad.count({ where: { id: comunidadId } }) : 1,
    certificacionIds.length
      ? Certificacion.findAll({ where: { id: certificacionIds }, attributes: ['id'] })
      : [],
  ]);
  return {
    categoria: categoria > 0,
    comunidad: comunidad > 0,
    certificacionIds: certificaciones.map((c) => c.id),
  };
};

// Cifras del bloque de trazabilidad: comunidades, familias, productos activos y
// países con pedidos confirmados (se excluyen pendientes y cancelados).
export const findTotalesTrazabilidad = async () => {
  const [totales] = await sequelize.query(
    `SELECT
       (SELECT COUNT(*)::int FROM comunidades)                                   AS comunidades,
       (SELECT COALESCE(SUM(familias_beneficiadas), 0)::int FROM comunidades)    AS familias,
       (SELECT COUNT(*)::int FROM productos WHERE activo)                        AS productos,
       (SELECT MIN(altitud_msnm) FROM comunidades)                               AS "altitudMinima",
       (SELECT MAX(altitud_msnm) FROM comunidades)                               AS "altitudMaxima"`,
    { type: QueryTypes.SELECT },
  );
  const paises = await sequelize.query(
    `SELECT DISTINCT envio_pais_codigo AS pais FROM pedidos
      WHERE estado NOT IN ('pendiente', 'cancelado')`,
    { type: QueryTypes.SELECT },
  );
  return { ...totales, paisesConPedidos: paises.map((p) => p.pais) };
};
