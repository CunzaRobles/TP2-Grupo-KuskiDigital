import { Op } from 'sequelize';
import { Usuario, sequelize } from '../models/index.js';
import { escaparLike } from '../utils/sql.js';

const plano = (fila) => fila?.get({ plain: true }) ?? null;

// Incluye passwordHash: solo para el login.
export const findByCorreoConPassword = async (correo) =>
  plano(await Usuario.scope('conPassword').findOne({ where: { correo } }));

export const existsByCorreo = async (correo) => (await Usuario.count({ where: { correo } })) > 0;

export const findById = async (id) => plano(await Usuario.findByPk(id));

export const create = async (datos) => {
  const { id } = await Usuario.create(datos);
  return findById(id); // defaultScope: sin passwordHash
};

// ─────────────────────────── Panel admin ───────────────────────────

const TOTAL_PEDIDOS = sequelize.literal(
  '(SELECT COUNT(*)::int FROM pedidos p WHERE p.usuario_id = "Usuario"."id")',
);

// Usuarios con filtros (texto, roles, activo) y el número de pedidos de cada uno.
export const findAdmin = async ({ q, roles, activo }, { limit, offset }) => {
  const where = {};
  if (roles?.length) where.rol = roles;
  if (activo !== undefined) where.activo = activo;
  if (q) {
    const patron = `%${escaparLike(q)}%`;
    where[Op.or] = [
      { nombre: { [Op.iLike]: patron } },
      { apellido: { [Op.iLike]: patron } },
      { correo: { [Op.iLike]: patron } },
    ];
  }
  const { rows, count } = await Usuario.findAndCountAll({
    where,
    attributes: {
      exclude: ['passwordHash'],
      include: [[TOTAL_PEDIDOS, 'totalPedidos']],
    },
    order: [
      ['creadoEn', 'DESC'],
      ['id', 'DESC'],
    ],
    limit,
    offset,
  });
  return { rows: rows.map(plano), count };
};

export const update = async (id, cambios) => {
  await Usuario.update(cambios, { where: { id } });
  return findById(id);
};
