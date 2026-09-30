import { cookieDe } from './sesion.js';

const usuarioRepository = await import('../../src/repositories/usuario.repository.js');

// Una cuenta por rol, como las del seed. El panel relee el rol en la base en cada petición
// (requireSesionVigente), así que usuarioRepository.findById debe devolverlas.
export const CUENTAS = {
  admin_gerente: { id: 1, nombre: 'Rosa', apellido: 'Huamán', correo: 'gerente@kuski.pe' },
  admin_ventas: { id: 2, nombre: 'Luis', apellido: 'Mamani', correo: 'ventas@kuski.pe' },
  admin_logistica: { id: 3, nombre: 'Carmen', apellido: 'Quispe', correo: 'logistica@kuski.pe' },
  cliente: { id: 10, nombre: 'María', apellido: 'Quispe', correo: 'maria.quispe@example.com' },
};

const fila = (rol) => ({
  ...CUENTAS[rol],
  rol,
  activo: true,
  paisCodigo: 'PE',
  idiomaPreferido: 'es',
  monedaPreferida: 'PEN',
});

/**
 * Configura usuarioRepository.findById con las cuentas de CUENTAS. `cambios` permite simular
 * que una cuenta cambió en la base después de iniciar sesión, p. ej. { 2: { rol: 'cliente' } }.
 * Llamar en beforeEach (mockReset limpia los mocks entre pruebas).
 */
export const registrarCuentas = (cambios = {}) => {
  const filas = Object.fromEntries(Object.keys(CUENTAS).map((rol) => [CUENTAS[rol].id, fila(rol)]));
  usuarioRepository.findById.mockImplementation(async (id) =>
    filas[id] ? { ...filas[id], ...cambios[id] } : null,
  );
};

// Cabecera Cookie con la sesión del rol indicado.
export const cookieRol = (rol) => cookieDe({ id: CUENTAS[rol].id, rol });
