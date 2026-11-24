import { Op } from 'sequelize';
import { Reclamacion, Usuario, sequelize } from '../models/index.js';

const plano = (fila) => fila.get({ plain: true });

// Clave del bloqueo que serializa la numeración correlativa (pg_advisory_xact_lock se libera
// sola al terminar la transacción).
const CLAVE_CORRELATIVO = 'reclamaciones.codigo';

const RESPONDIDO_POR = {
  model: Usuario,
  as: 'respondidoPorUsuario',
  attributes: ['id', 'nombre', 'apellido'],
};

/** Bloquea la numeración hasta el fin de la transacción: dos reclamos no comparten código. */
export const bloquearCorrelativo = async (tx) => {
  await sequelize.query('SELECT pg_advisory_xact_lock(hashtext(:clave))', {
    replacements: { clave: CLAVE_CORRELATIVO },
    transaction: tx,
  });
};

/** Último código registrado en el año (LR-2026-000041) o null. */
export const findUltimoCodigo = async (anio, tx) => {
  const fila = await Reclamacion.findOne({
    where: { codigo: { [Op.like]: `LR-${anio}-%` } },
    attributes: ['codigo'],
    order: [['codigo', 'DESC']],
    transaction: tx,
  });
  return fila?.codigo ?? null;
};

export const create = async (datos, tx) =>
  plano(await Reclamacion.create(datos, { transaction: tx }));

export const findById = async (id, tx) => {
  const fila = await Reclamacion.findByPk(id, { include: [RESPONDIDO_POR], transaction: tx });
  return fila ? plano(fila) : null;
};

export const update = async (id, cambios, tx) => {
  await Reclamacion.update(cambios, { where: { id }, transaction: tx });
};

// Filtros del panel: estado y rango de fechas de registro (AAAA-MM-DD en la hora de Lima;
// `hasta` incluye el día completo).
const whereAdmin = ({ estados, desde, hasta }) => {
  const where = {};
  const y = [];
  const fechaLima = sequelize.literal(
    `("Reclamacion"."creado_en" AT TIME ZONE 'America/Lima')::date`,
  );
  if (estados?.length) where.estado = estados;
  if (desde) y.push(sequelize.where(fechaLima, Op.gte, desde));
  if (hasta) y.push(sequelize.where(fechaLima, Op.lte, hasta));
  if (y.length) where[Op.and] = y;
  return where;
};

// Panel admin: las más urgentes primero (pendientes por fecha límite), luego las respondidas.
export const findAdmin = async (filtros, { limit, offset }) => {
  const { rows, count } = await Reclamacion.findAndCountAll({
    where: whereAdmin(filtros),
    include: [RESPONDIDO_POR],
    order: [
      [sequelize.literal(`CASE WHEN "Reclamacion"."estado" = 'respondido' THEN 1 ELSE 0 END`)],
      ['fechaLimite', 'ASC'],
      ['id', 'ASC'],
    ],
    limit,
    offset,
  });
  return { rows: rows.map(plano), count };
};
