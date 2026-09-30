import { emailSender } from '../adapters/email/index.js';
import * as usuarioRepository from '../repositories/usuario.repository.js';
import { AppError } from '../utils/app-error.js';
import { firmarToken } from '../utils/jwt.js';
import { compararPassword, hashPassword } from '../utils/password.js';

// Hash de una contraseña cualquiera: si el correo no existe se compara igual contra él,
// para que el tiempo de respuesta no revele qué correos están registrados.
const HASH_FALSO = '$2b$10$CAo2O.JfzTGXC2KuUAen2e07BsFMPCCToSYxlkY3pDA2T8VMyOhJe';

export const toUsuarioDTO = (u) => ({
  id: u.id,
  nombre: u.nombre,
  apellido: u.apellido,
  correo: u.correo,
  telefono: u.telefono ?? null,
  paisCodigo: u.paisCodigo,
  idiomaPreferido: u.idiomaPreferido,
  monedaPreferida: u.monedaPreferida,
  rol: u.rol,
});

const credencialesInvalidas = () =>
  new AppError(401, 'CREDENCIALES_INVALIDAS', 'Correo o contraseña incorrectos');

// Los correos simulados nunca deben romper la operación principal.
const enviarCorreo = async (correo) => {
  try {
    await emailSender.enviar(correo);
  } catch (error) {
    console.error('No se pudo enviar el correo simulado:', error.message);
  }
};

export const registrar = async ({ password, ...datos }) => {
  if (await usuarioRepository.existsByCorreo(datos.correo)) {
    throw new AppError(409, 'CORREO_EN_USO', 'Ya existe una cuenta con ese correo');
  }

  const usuario = await usuarioRepository.create({
    ...datos,
    rol: 'cliente',
    passwordHash: await hashPassword(password),
  });

  await enviarCorreo({
    para: usuario.correo,
    asunto: 'Bienvenida a Kuski Digital',
    texto: `Hola ${usuario.nombre}, gracias por crear tu cuenta. Cada producto que compres llega directamente de una comunidad productora de Cusco.`,
  });

  return { usuario: toUsuarioDTO(usuario), token: firmarToken(usuario) };
};

export const login = async ({ correo, password }) => {
  const usuario = await usuarioRepository.findByCorreoConPassword(correo);
  const valida = await compararPassword(password, usuario?.passwordHash ?? HASH_FALSO);

  if (!usuario || !valida) throw credencialesInvalidas();
  if (!usuario.activo) throw new AppError(403, 'CUENTA_INACTIVA', 'La cuenta está desactivada');

  return { usuario: toUsuarioDTO(usuario), token: firmarToken(usuario) };
};

export const perfil = async (id) => {
  const usuario = await usuarioRepository.findById(id);
  if (!usuario || !usuario.activo) {
    throw new AppError(401, 'NO_AUTENTICADO', 'La sesión ya no es válida');
  }
  return toUsuarioDTO(usuario);
};
