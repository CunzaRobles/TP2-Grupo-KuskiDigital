import { Direccion } from '../models/index.js';

const plano = (fila) => fila.get({ plain: true });

const ATRIBUTOS = [
  'id',
  'nombreDestinatario',
  'paisCodigo',
  'ciudad',
  'direccion',
  'codigoPostal',
  'telefono',
  'esPrincipal',
  'creadoEn',
];

export const findByIdAndUsuario = async (id, usuarioId, tx) => {
  const fila = await Direccion.findOne({
    where: { id, usuarioId },
    attributes: ATRIBUTOS,
    transaction: tx,
  });
  return fila ? plano(fila) : null;
};

// La principal primero y luego de la más reciente a la más antigua.
export const findByUsuario = async (usuarioId, tx) => {
  const filas = await Direccion.findAll({
    where: { usuarioId },
    attributes: ATRIBUTOS,
    order: [
      ['esPrincipal', 'DESC'],
      ['creadoEn', 'DESC'],
      ['id', 'DESC'],
    ],
    transaction: tx,
  });
  return filas.map(plano);
};

export const countByUsuario = (usuarioId, tx) =>
  Direccion.count({ where: { usuarioId }, transaction: tx });

export const create = async (datos, tx) => {
  const fila = await Direccion.create(datos, { transaction: tx });
  return findByIdAndUsuario(fila.id, datos.usuarioId, tx);
};

export const update = async (id, cambios, tx) => {
  await Direccion.update(cambios, { where: { id }, transaction: tx });
};

// Quita la marca de principal (el índice único admite una sola por usuario).
export const desmarcarPrincipal = async (usuarioId, tx) => {
  await Direccion.update(
    { esPrincipal: false },
    { where: { usuarioId, esPrincipal: true }, transaction: tx },
  );
};

export const remove = async (id, tx) => {
  await Direccion.destroy({ where: { id }, transaction: tx });
};
