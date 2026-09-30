import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { cookieDe } from './helpers/sesion.js';

const direccionRepository = await import('../src/repositories/direccion.repository.js');
const { withTransaction } = await import('../src/repositories/transaction.repository.js');
const { default: app } = await import('../src/app.js');

const TX = { tx: 'mock' };
const sesion = cookieDe({ id: 10 });

// Filas como las devuelve direccion.repository
const fila = (id, datos = {}) => ({
  id,
  nombreDestinatario: 'María Quispe',
  paisCodigo: 'PE',
  ciudad: 'Cusco',
  direccion: `Av. de la Cultura ${id}`,
  codigoPostal: null,
  telefono: null,
  esPrincipal: false,
  creadoEn: '2026-09-29T15:00:00.000Z',
  ...datos,
});

const nueva = {
  nombreDestinatario: 'Anna Becker',
  paisCodigo: 'de',
  ciudad: 'Berlin',
  direccion: 'Kastanienallee 12',
  codigoPostal: '10435',
};

beforeEach(() => {
  direccionRepository.create.mockImplementation(async (datos) => ({ id: 3, ...datos }));
});

describe('direcciones sin sesión', () => {
  it('todas las rutas exigen autenticación', async () => {
    const respuestas = await Promise.all([
      request(app).get('/api/v1/direcciones'),
      request(app).post('/api/v1/direcciones').send(nueva),
      request(app).patch('/api/v1/direcciones/1').send({ esPrincipal: true }),
      request(app).delete('/api/v1/direcciones/1'),
    ]);
    expect(respuestas.map((r) => r.status)).toEqual([401, 401, 401, 401]);
  });
});

describe('GET /api/v1/direcciones', () => {
  it('lista las direcciones del usuario sin exponer campos internos', async () => {
    direccionRepository.findByUsuario.mockResolvedValue([fila(1, { esPrincipal: true }), fila(2)]);

    const res = await request(app).get('/api/v1/direcciones').set('Cookie', sesion);

    expect(res.status).toBe(200);
    expect(direccionRepository.findByUsuario).toHaveBeenCalledWith(10);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toEqual({
      id: 1,
      nombreDestinatario: 'María Quispe',
      paisCodigo: 'PE',
      ciudad: 'Cusco',
      direccion: 'Av. de la Cultura 1',
      codigoPostal: null,
      telefono: null,
      esPrincipal: true,
    });
  });
});

describe('POST /api/v1/direcciones', () => {
  it('la primera dirección de la cuenta es la principal', async () => {
    direccionRepository.countByUsuario.mockResolvedValue(0);

    const res = await request(app).post('/api/v1/direcciones').set('Cookie', sesion).send(nueva);

    expect(res.status).toBe(201);
    expect(withTransaction).toHaveBeenCalledTimes(1);
    expect(direccionRepository.desmarcarPrincipal).toHaveBeenCalledWith(10, TX);
    expect(direccionRepository.create).toHaveBeenCalledWith(
      { ...nueva, paisCodigo: 'DE', usuarioId: 10, esPrincipal: true },
      TX,
    );
    expect(res.body.data).toMatchObject({ id: 3, paisCodigo: 'DE', esPrincipal: true });
  });

  it('las siguientes no cambian la principal salvo que se pida', async () => {
    direccionRepository.countByUsuario.mockResolvedValue(2);

    await request(app).post('/api/v1/direcciones').set('Cookie', sesion).send(nueva);

    expect(direccionRepository.desmarcarPrincipal).not.toHaveBeenCalled();
    expect(direccionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ esPrincipal: false }),
      TX,
    );
  });

  it('responde 422 LIMITE_DIRECCIONES con 10 direcciones y 400 si faltan datos', async () => {
    direccionRepository.countByUsuario.mockResolvedValue(10);

    const limite = await request(app).post('/api/v1/direcciones').set('Cookie', sesion).send(nueva);
    const invalida = await request(app)
      .post('/api/v1/direcciones')
      .set('Cookie', sesion)
      .send({ ...nueva, paisCodigo: 'Alemania', direccion: 'x' });

    expect(limite.status).toBe(422);
    expect(limite.body.error.code).toBe('LIMITE_DIRECCIONES');
    expect(invalida.status).toBe(400);
    expect(invalida.body.error.details.map((d) => d.path)).toEqual(
      expect.arrayContaining(['paisCodigo', 'direccion']),
    );
  });
});

describe('PATCH /api/v1/direcciones/:id', () => {
  it('marca otra dirección como principal', async () => {
    direccionRepository.findByIdAndUsuario
      .mockResolvedValueOnce(fila(2))
      .mockResolvedValueOnce(fila(2, { esPrincipal: true }));

    const res = await request(app)
      .patch('/api/v1/direcciones/2')
      .set('Cookie', sesion)
      .send({ esPrincipal: true });

    expect(res.status).toBe(200);
    expect(direccionRepository.findByIdAndUsuario).toHaveBeenCalledWith(2, 10, TX);
    expect(direccionRepository.desmarcarPrincipal).toHaveBeenCalledWith(10, TX);
    expect(direccionRepository.update).toHaveBeenCalledWith(2, { esPrincipal: true }, TX);
    expect(res.body.data.esPrincipal).toBe(true);
  });

  it('no permite desmarcar la principal y responde 404 si no es del usuario', async () => {
    const desmarcar = await request(app)
      .patch('/api/v1/direcciones/1')
      .set('Cookie', sesion)
      .send({ esPrincipal: false });
    expect(desmarcar.status).toBe(400);

    direccionRepository.findByIdAndUsuario.mockResolvedValue(null);
    const ajena = await request(app)
      .patch('/api/v1/direcciones/99')
      .set('Cookie', sesion)
      .send({ ciudad: 'Lima' });
    expect(ajena.status).toBe(404);
    expect(ajena.body.error.code).toBe('DIRECCION_NO_ENCONTRADA');
  });
});

describe('DELETE /api/v1/direcciones/:id', () => {
  it('al borrar la principal, la más reciente de las restantes pasa a serlo', async () => {
    direccionRepository.findByIdAndUsuario.mockResolvedValue(fila(1, { esPrincipal: true }));
    direccionRepository.findByUsuario.mockResolvedValue([fila(3), fila(2)]);

    const res = await request(app).delete('/api/v1/direcciones/1').set('Cookie', sesion);

    expect(res.status).toBe(200);
    expect(direccionRepository.remove).toHaveBeenCalledWith(1, TX);
    expect(direccionRepository.update).toHaveBeenCalledWith(3, { esPrincipal: true }, TX);
    expect(res.body.data.map((d) => [d.id, d.esPrincipal])).toEqual([
      [3, true],
      [2, false],
    ]);
  });

  it('borrar una secundaria no cambia la principal', async () => {
    direccionRepository.findByIdAndUsuario.mockResolvedValue(fila(2));
    direccionRepository.findByUsuario.mockResolvedValue([fila(1, { esPrincipal: true })]);

    await request(app).delete('/api/v1/direcciones/2').set('Cookie', sesion);

    expect(direccionRepository.update).not.toHaveBeenCalled();
  });
});
