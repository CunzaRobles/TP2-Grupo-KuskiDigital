import { Op } from 'sequelize';
import { Categoria, sequelize } from '../models/index.js';
import { escaparLike } from '../utils/sql.js';

const plano = (fila) => fila?.get({ plain: true }) ?? null;

// Productos de la categoría, activos e inactivos (para saber si se puede eliminar).
const TOTAL_PRODUCTOS = sequelize.literal(
  '(SELECT COUNT(*)::int FROM productos p WHERE p.categoria_id = "Categoria"."id")',
);
const PRODUCTOS_ACTIVOS = sequelize.literal(
  '(SELECT COUNT(*)::int FROM productos p WHERE p.categoria_id = "Categoria"."id" AND p.activo)',
);

const ATRIBUTOS = [
  'id',
  'nombre',
  'slug',
  'descripcion',
  'imagenUrl',
  'orden',
  [TOTAL_PRODUCTOS, 'totalProductos'],
  [PRODUCTOS_ACTIVOS, 'productosActivos'],
];

export const findAll = async () => {
  const filas = await Categoria.findAll({
    attributes: ATRIBUTOS,
    order: [
      ['orden', 'ASC'],
      ['id', 'ASC'],
    ],
  });
  return filas.map(plano);
};

export const findById = async (id) =>
  plano(await Categoria.findByPk(id, { attributes: ATRIBUTOS }));

// ¿Hay otra categoría con ese nombre o slug? → { nombre: boolean, slug: boolean }
export const findConflictos = async ({ nombre, slug }, excluirId) => {
  const filas = await Categoria.findAll({
    where: {
      [Op.or]: [
        ...(nombre ? [{ nombre: { [Op.iLike]: escaparLike(nombre) } }] : []),
        ...(slug ? [{ slug }] : []),
      ],
      ...(excluirId && { id: { [Op.ne]: excluirId } }),
    },
    attributes: ['nombre', 'slug'],
  });
  return {
    nombre: Boolean(nombre) && filas.some((f) => f.nombre.toLowerCase() === nombre.toLowerCase()),
    slug: Boolean(slug) && filas.some((f) => f.slug === slug),
  };
};

export const create = async (datos) => {
  const { id } = await Categoria.create(datos);
  return findById(id);
};

export const update = async (id, cambios) => {
  await Categoria.update(cambios, { where: { id } });
  return findById(id);
};

export const remove = async (id) => {
  await Categoria.destroy({ where: { id } });
};
