import * as usuarioRepository from '../repositories/usuario.repository.js';
import { AppError } from '../utils/app-error.js';
import { hashPassword } from '../utils/password.js';
import { toUsuarioDTO } from './auth.service.js';

const toUsuarioAdminDTO = (u) => ({
  ...toUsuarioDTO(u),
  activo: u.activo,
  totalPedidos: u.totalPedidos ?? 0,
  creadoEn: u.creadoEn,
});

export const listarUsuarios = async ({ page, limit, ...filtros }) => {
  const { rows, count } = await usuarioRepository.findAdmin(filtros, {
    limit,
    offset: (page - 1) * limit,
  });
  return {
    items: rows.map(toUsuarioAdminDTO),
    pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
  };
};

// Alta de una cuenta (normalmente del equipo) con el rol indicado.
export const crearUsuario = async ({ password, ...datos }) => {
  if (await usuarioRepository.existsByCorreo(datos.correo)) {
    throw new AppError(409, 'CORREO_EN_USO', 'Ya existe una cuenta con ese correo');
  }
  const usuario = await usuarioRepository.create({
    ...datos,
    passwordHash: await hashPassword(password),
  });
  return toUsuarioAdminDTO(usuario);
};

/**
 * Cambia el rol o activa/desactiva una cuenta. Un gerente no puede quitarse su propio rol ni
 * desactivarse: así el panel nunca se queda sin nadie que lo administre.
 */
export const actualizarUsuario = async (admin, id, { rol, activo }) => {
  const usuario = await usuarioRepository.findById(id);
  if (!usuario) throw new AppError(404, 'USUARIO_NO_ENCONTRADO', 'No encontramos ese usuario');

  if (id === admin.id && ((rol && rol !== usuario.rol) || activo === false)) {
    throw new AppError(
      422,
      'ACCION_SOBRE_SI_MISMO',
      'No puedes cambiar tu propio rol ni desactivar tu cuenta',
    );
  }

  const cambios = { ...(rol && { rol }), ...(activo !== undefined && { activo }) };
  const actualizado = Object.keys(cambios).length
    ? await usuarioRepository.update(id, cambios)
    : usuario;
  return toUsuarioAdminDTO(actualizado);
};
