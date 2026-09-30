import * as direccionRepository from '../repositories/direccion.repository.js';
import { withTransaction } from '../repositories/transaction.repository.js';
import { AppError } from '../utils/app-error.js';

// Máximo de direcciones guardadas por cuenta.
export const MAX_DIRECCIONES = 10;

const noEncontrada = () =>
  new AppError(404, 'DIRECCION_NO_ENCONTRADA', 'La dirección no existe en tu cuenta');

export const toDireccionDTO = (d) => ({
  id: d.id,
  nombreDestinatario: d.nombreDestinatario,
  paisCodigo: d.paisCodigo,
  ciudad: d.ciudad,
  direccion: d.direccion,
  codigoPostal: d.codigoPostal ?? null,
  telefono: d.telefono ?? null,
  esPrincipal: d.esPrincipal,
});

export const listar = async (usuarioId) =>
  (await direccionRepository.findByUsuario(usuarioId)).map(toDireccionDTO);

/**
 * Guarda una dirección. La primera de la cuenta es la principal; si llega `esPrincipal`,
 * la anterior deja de serlo. Acepta una transacción externa (checkout con "guardar dirección").
 */
export const crear = async (usuarioId, { esPrincipal = false, ...datos }, txExterna) => {
  const ejecutar = async (tx) => {
    const total = await direccionRepository.countByUsuario(usuarioId, tx);
    if (total >= MAX_DIRECCIONES) {
      throw new AppError(
        422,
        'LIMITE_DIRECCIONES',
        `Puedes guardar hasta ${MAX_DIRECCIONES} direcciones`,
      );
    }
    const principal = esPrincipal || total === 0;
    if (principal) await direccionRepository.desmarcarPrincipal(usuarioId, tx);
    return direccionRepository.create({ ...datos, usuarioId, esPrincipal: principal }, tx);
  };

  const direccion = txExterna ? await ejecutar(txExterna) : await withTransaction(ejecutar);
  return toDireccionDTO(direccion);
};

export const actualizar = async (usuarioId, id, { esPrincipal, ...cambios }) => {
  const direccion = await withTransaction(async (tx) => {
    const actual = await direccionRepository.findByIdAndUsuario(id, usuarioId, tx);
    if (!actual) throw noEncontrada();
    // Siempre queda una principal: se puede marcar otra, pero no desmarcar la actual.
    const datos = { ...cambios };
    if (esPrincipal && !actual.esPrincipal) {
      await direccionRepository.desmarcarPrincipal(usuarioId, tx);
      datos.esPrincipal = true;
    }
    if (Object.keys(datos).length) await direccionRepository.update(id, datos, tx);
    return direccionRepository.findByIdAndUsuario(id, usuarioId, tx);
  });
  return toDireccionDTO(direccion);
};

// Si se borra la principal, la más reciente de las restantes pasa a serlo.
export const eliminar = (usuarioId, id) =>
  withTransaction(async (tx) => {
    const actual = await direccionRepository.findByIdAndUsuario(id, usuarioId, tx);
    if (!actual) throw noEncontrada();
    await direccionRepository.remove(id, tx);

    const restantes = await direccionRepository.findByUsuario(usuarioId, tx);
    if (actual.esPrincipal && restantes.length) {
      await direccionRepository.update(restantes[0].id, { esPrincipal: true }, tx);
      restantes[0] = { ...restantes[0], esPrincipal: true };
    }
    return restantes.map(toDireccionDTO);
  });
