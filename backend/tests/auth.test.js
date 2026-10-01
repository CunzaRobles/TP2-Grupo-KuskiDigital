import cookieParser from 'cookie-parser';
import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { cookieDe, cookieSesion } from './helpers/sesion.js';

const usuarioRepository = await import('../src/repositories/usuario.repository.js');
const { default: app } = await import('../src/app.js');
const { requireAuth, requireRol } = await import('../src/middleware/auth.js');
const { errorHandler } = await import('../src/middleware/error-handler.js');
const { hashPassword } = await import('../src/utils/password.js');

const PASSWORD = 'Quinua2026';
const HASH = await hashPassword(PASSWORD);

const usuarioDb = {
  id: 7,
  nombre: 'María',
  apellido: 'Quispe',
  correo: 'maria.quispe@example.com',
  telefono: '+51 987 654 321',
  paisCodigo: 'PE',
  idiomaPreferido: 'es',
  monedaPreferida: 'PEN',
  rol: 'cliente',
  activo: true,
};

describe('POST /api/v1/auth/registro', () => {
  beforeEach(() => {
    usuarioRepository.existsByCorreo.mockResolvedValue(false);
    usuarioRepository.create.mockImplementation(async (datos) => ({ ...usuarioDb, ...datos }));
  });

  const nuevo = {
    nombre: 'María',
    apellido: 'Quispe',
    correo: '  Maria.Quispe@Example.com ',
    password: PASSWORD,
    paisCodigo: 'pe',
  };

  it('crea un cliente, guarda la contraseña con bcrypt e inicia sesión con cookie httpOnly', async () => {
    const res = await request(app).post('/api/v1/auth/registro').send(nuevo);

    expect(res.status).toBe(201);
    expect(res.body.data.usuario).toMatchObject({
      correo: 'maria.quispe@example.com',
      rol: 'cliente',
    });
    expect(res.body.data.usuario).not.toHaveProperty('passwordHash');

    const datos = usuarioRepository.create.mock.calls[0][0];
    expect(datos.correo).toBe('maria.quispe@example.com'); // normalizado
    expect(datos.paisCodigo).toBe('PE');
    expect(datos.rol).toBe('cliente');
    expect(datos.passwordHash).toMatch(/^\$2[aby]\$10\$/);
    expect(datos).not.toHaveProperty('password');

    const cookie = cookieSesion(res);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
    expect(cookie).not.toMatch(/Secure/); // solo en producción
  });

  it('ignora un rol enviado por el cliente (siempre registra clientes)', async () => {
    await request(app)
      .post('/api/v1/auth/registro')
      .send({ ...nuevo, rol: 'admin_gerente' });

    expect(usuarioRepository.create.mock.calls[0][0].rol).toBe('cliente');
  });

  it('responde 409 CORREO_EN_USO si el correo ya existe', async () => {
    usuarioRepository.existsByCorreo.mockResolvedValue(true);

    const res = await request(app).post('/api/v1/auth/registro').send(nuevo);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CORREO_EN_USO');
    expect(usuarioRepository.create).not.toHaveBeenCalled();
  });

  it('valida correo y contraseña con Zod', async () => {
    const res = await request(app)
      .post('/api/v1/auth/registro')
      .send({ ...nuevo, correo: 'no-es-correo', password: 'corta' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d) => d.path)).toEqual(
      expect.arrayContaining(['correo', 'password']),
    );
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(() => {
    usuarioRepository.findByCorreoConPassword.mockResolvedValue({
      ...usuarioDb,
      passwordHash: HASH,
    });
  });

  it('con credenciales correctas devuelve el usuario y la cookie de sesión', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ correo: 'MARIA.QUISPE@example.com', password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data.usuario).toMatchObject({ id: 7, rol: 'cliente' });
    expect(res.body.data.usuario).not.toHaveProperty('passwordHash');
    expect(res.body.data).not.toHaveProperty('token'); // el JWT solo viaja en la cookie
    expect(cookieSesion(res)).toBeDefined();
    expect(usuarioRepository.findByCorreoConPassword).toHaveBeenCalledWith(
      'maria.quispe@example.com',
    );
  });

  it('responde 401 CREDENCIALES_INVALIDAS con contraseña incorrecta', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ correo: usuarioDb.correo, password: 'otraClave1' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('CREDENCIALES_INVALIDAS');
    expect(cookieSesion(res)).toBeUndefined();
  });

  it('responde el mismo 401 si el correo no existe (no revela cuentas)', async () => {
    usuarioRepository.findByCorreoConPassword.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ correo: 'nadie@example.com', password: PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('CREDENCIALES_INVALIDAS');
  });

  it('responde 403 CUENTA_INACTIVA si la cuenta está desactivada', async () => {
    usuarioRepository.findByCorreoConPassword.mockResolvedValue({
      ...usuarioDb,
      activo: false,
      passwordHash: HASH,
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ correo: usuarioDb.correo, password: PASSWORD });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CUENTA_INACTIVA');
  });
});

describe('GET /api/v1/auth/me y POST /api/v1/auth/logout', () => {
  it('sin cookie responde 200 con usuario null (visitante anónimo)', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { usuario: null } });
    expect(usuarioRepository.findById).not.toHaveBeenCalled();
  });

  it('con un token manipulado no hay sesión', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', `${cookieDe({ id: 7 })}x`);

    expect(res.status).toBe(200);
    expect(res.body.data.usuario).toBeNull();
  });

  it('con la cuenta desactivada responde 401', async () => {
    usuarioRepository.findById.mockResolvedValue({ ...usuarioDb, activo: false });

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', cookieDe({ id: 7 }));

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('NO_AUTENTICADO');
  });

  it('con sesión válida devuelve el perfil', async () => {
    usuarioRepository.findById.mockResolvedValue(usuarioDb);

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', cookieDe({ id: 7 }));

    expect(res.status).toBe(200);
    expect(res.body.data.usuario.correo).toBe(usuarioDb.correo);
    expect(usuarioRepository.findById).toHaveBeenCalledWith(7);
  });

  it('flujo login → me → logout con la cookie real', async () => {
    usuarioRepository.findByCorreoConPassword.mockResolvedValue({
      ...usuarioDb,
      passwordHash: HASH,
    });
    usuarioRepository.findById.mockResolvedValue(usuarioDb);
    const agente = request.agent(app);

    await agente.post('/api/v1/auth/login').send({ correo: usuarioDb.correo, password: PASSWORD });
    expect((await agente.get('/api/v1/auth/me')).status).toBe(200);

    const logout = await agente.post('/api/v1/auth/logout');
    expect(logout.status).toBe(200);
    expect(cookieSesion(logout)).toMatch(/Expires=Thu, 01 Jan 1970/);
    expect((await agente.get('/api/v1/auth/me')).body.data.usuario).toBeNull();
  });
});

describe('middleware requireRol', () => {
  const appRoles = express();
  appRoles.use(cookieParser());
  appRoles.get('/admin', requireAuth, requireRol('admin_gerente', 'admin_ventas'), (_req, res) =>
    res.json({ data: 'ok' }),
  );
  appRoles.use(errorHandler);

  it('permite el acceso a los roles indicados', async () => {
    const res = await request(appRoles)
      .get('/admin')
      .set('Cookie', cookieDe({ rol: 'admin_ventas' }));
    expect(res.status).toBe(200);
  });

  it('responde 403 SIN_PERMISO a otros roles', async () => {
    const res = await request(appRoles)
      .get('/admin')
      .set('Cookie', cookieDe({ rol: 'cliente' }));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('SIN_PERMISO');
  });

  it('responde 401 sin sesión', async () => {
    const res = await request(appRoles).get('/admin');
    expect(res.status).toBe(401);
  });
});
