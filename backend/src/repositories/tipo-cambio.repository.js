import { TipoCambio } from '../models/index.js';

const ATRIBUTOS = ['monedaCodigo', 'simbolo', 'valorEnPen'];

export const findByMoneda = async (moneda) => {
  const fila = await TipoCambio.findByPk(moneda, { attributes: ATRIBUTOS });
  return fila?.get({ plain: true }) ?? null;
};

export const findAll = async () => {
  const filas = await TipoCambio.findAll({
    attributes: ATRIBUTOS,
    order: [['monedaCodigo', 'ASC']],
  });
  return filas.map((f) => f.get({ plain: true }));
};
