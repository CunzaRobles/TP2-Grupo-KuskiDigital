import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PERMISOS } from '../src/config/permisos.js';
import { PERMISOS as PERMISOS_FRONTEND } from '../../frontend/src/features/admin/permisos.js';
import { cookieRol, registrarCuentas } from './helpers/admin.js';
import { cookieDe } from './helpers/sesion.js';

const { default: app } = await import('../src/app.js');

// Cada endpoint del panel con el permiso que lo protege (config/permisos.js).
// `null` = cualquier rol admin.
const ENDPOINTS = [
  ['get', '/admin/dashboard', 'dashboard'],
  ['get', '/admin/ventas', 'ventas'],
  ['get', '/admin/estadisticas', 'estadisticas'],
  ['get', '/admin/pedidos', 'pedidos'],
  ['get', '/admin/pedidos/KD-000001', 'pedidos'],
  ['patch', '/admin/pedidos/KD-000001/estado', 'pedidosEstado'],
  ['get', '/admin/productos', 'productos'],
  ['post', '/admin/productos', 'productos'],
  ['get', '/admin/productos/1', 'productos'],
  ['put', '/admin/productos/1', 'productos'],
  ['delete', '/admin/productos/1', 'productos'],
  ['post', '/admin/productos/1/imagenes', 'productos'],
  ['patch', '/admin/productos/1/imagenes/2', 'productos'],
  ['delete', '/admin/productos/1/imagenes/2', 'productos'],
  ['get', '/admin/inventario', 'inventario'],
  ['post', '/admin/inventario/movimientos', 'inventario'],
  ['get', '/admin/inventario/1/movimientos', 'inventario'],
  ['get', '/admin/categorias', 'categorias'],
  ['post', '/admin/categorias', 'categorias'],
  ['put', '/admin/categorias/1', 'categorias'],
  ['delete', '/admin/categorias/1', 'categorias'],
  ['get', '/admin/usuarios', 'usuarios'],
  ['post', '/admin/usuarios', 'usuarios'],
  ['patch', '/admin/usuarios/5', 'usuarios'],
  ['get', '/admin/buscar?q=cafe', null],
];

const ROLES_ADMIN = ['admin_gerente', 'admin_ventas', 'admin_logistica'];

const llamar = (metodo, ruta, cookie) => {
  const req = request(app)[metodo](`/api/v1${ruta}`);
  return cookie ? req.set('Cookie', cookie) : req;
};

beforeEach(() => {
  registrarCuentas();
  // Con permiso, los repositorios simulados sin datos pueden terminar en 404/500: aquí solo
  // importa que la autorización deje pasar. Se silencian los logs de esos errores.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('Panel admin · autorización por rol', () => {
  it.each(ENDPOINTS)('%s %s exige sesión (401)', async (metodo, ruta) => {
    const res = await llamar(metodo, ruta);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('NO_AUTENTICADO');
  });

  it.each(ENDPOINTS)('%s %s rechaza a un cliente (403)', async (metodo, ruta) => {
    const res = await llamar(metodo, ruta, cookieRol('cliente'));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('SIN_PERMISO');
  });

  const casos = ENDPOINTS.flatMap(([metodo, ruta, permiso]) =>
    ROLES_ADMIN.map((rol) => [rol, metodo, ruta, !permiso || PERMISOS[permiso].includes(rol)]),
  );

  it.each(casos)('%s → %s %s (permitido: %s)', async (rol, metodo, ruta, permitido) => {
    const res = await llamar(metodo, ruta, cookieRol(rol));
    if (permitido) {
      expect([401, 403]).not.toContain(res.status);
    } else {
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('SIN_PERMISO');
    }
  });
});

describe('Panel admin · sesión vigente', () => {
  it('usa el rol actual de la base, no el del JWT: un admin degradado pierde el acceso', async () => {
    registrarCuentas({ 2: { rol: 'cliente' } });
    const res = await llamar('get', '/admin/dashboard', cookieRol('admin_ventas'));
    expect(res.status).toBe(403);
  });

  it('una cuenta desactivada no entra aunque su JWT siga vigente', async () => {
    registrarCuentas({ 1: { activo: false } });
    const res = await llamar('get', '/admin/dashboard', cookieRol('admin_gerente'));
    expect(res.status).toBe(401);
  });

  it('un JWT con rol admin no sirve si en la base la cuenta es de cliente', async () => {
    const res = await llamar('get', '/admin/usuarios', cookieDe({ id: 10, rol: 'admin_gerente' }));
    expect(res.status).toBe(403);
  });

  it('una cuenta que ya no existe recibe 401', async () => {
    const res = await llamar(
      'get',
      '/admin/dashboard',
      cookieDe({ id: 999, rol: 'admin_gerente' }),
    );
    expect(res.status).toBe(401);
  });
});

describe('Matriz de permisos', () => {
  it('el frontend usa la misma matriz que el backend', () => {
    expect(PERMISOS_FRONTEND).toEqual(PERMISOS);
  });

  it('el gerente tiene todos los permisos', () => {
    for (const roles of Object.values(PERMISOS)) expect(roles).toContain('admin_gerente');
  });
});
