import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cookieRol, registrarCuentas } from './helpers/admin.js';
import { filaReclamacion, HOJA_VALIDA } from './helpers/reclamaciones.js';

const reclamacionRepository = await import('../src/repositories/reclamacion.repository.js');
const { default: app } = await import('../src/app.js');
const { crearReclamacionLimiter } = await import('../src/middleware/rate-limit.js');

describe('POST /api/v1/reclamaciones (público)', () => {
  beforeEach(() => {
    reclamacionRepository.findUltimoCodigo.mockResolvedValue(null);
    reclamacionRepository.create.mockImplementation(async (datos) =>
      filaReclamacion({ ...datos, montoReclamado: datos.montoReclamado ?? null }),
    );
  });

  it('registra una hoja válida sin sesión → 201 con el código y la fecha límite', async () => {
    const res = await request(app).post('/api/v1/reclamaciones').send(HOJA_VALIDA);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      codigo: expect.stringMatching(/^LR-\d{4}-000001$/),
      tipo: 'reclamo',
      estado: 'recibido',
      consumidor: { nombre: 'María Quispe Huamán', tipoDocumento: 'DNI' },
      bien: { tipo: 'producto', pedidoCodigo: 'KD-000123', montoReclamado: 65 },
    });
    expect(res.body.data.fechaLimite).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // Lo que se guarda: datos validados, sin campos ajenos
    const datos = reclamacionRepository.create.mock.calls[0][0];
    expect(datos).toMatchObject({ correo: 'maria.quispe@example.com', estado: 'recibido' });
  });

  it('ignora campos que no son de la hoja (estado, respuesta)', async () => {
    await request(app)
      .post('/api/v1/reclamaciones')
      .send({ ...HOJA_VALIDA, estado: 'respondido', respuesta: 'Ya está', respondidoPor: 1 });

    const datos = reclamacionRepository.create.mock.calls[0][0];
    expect(datos.estado).toBe('recibido');
    expect(datos).not.toHaveProperty('respuesta');
    expect(datos).not.toHaveProperty('respondidoPor');
  });

  it('rechaza una hoja inválida → 400 con el campo de cada error', async () => {
    const res = await request(app)
      .post('/api/v1/reclamaciones')
      .send({ ...HOJA_VALIDA, numeroDocumento: '123', correo: 'no-es-correo', detalle: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d) => d.path)).toEqual(
      expect.arrayContaining(['numeroDocumento', 'correo', 'detalle']),
    );
    expect(reclamacionRepository.create).not.toHaveBeenCalled();
  });
});

describe('Límite de 5 hojas por hora por IP', () => {
  it('la sexta petición de la misma IP recibe 429', async () => {
    const mini = express();
    mini.post('/', crearReclamacionLimiter(), (_req, res) => res.status(201).end());

    for (let i = 0; i < 5; i += 1) {
      expect((await request(mini).post('/')).status).toBe(201);
    }
    const res = await request(mini).post('/');
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
  });
});

describe('Panel · /api/v1/admin/reclamaciones', () => {
  beforeEach(() => {
    registrarCuentas();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('un cliente recibe 403', async () => {
    const res = await request(app)
      .get('/api/v1/admin/reclamaciones')
      .set('Cookie', cookieRol('cliente'));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('SIN_PERMISO');
  });

  it('logística no gestiona reclamaciones (403); gerente y ventas sí', async () => {
    reclamacionRepository.findAdmin.mockResolvedValue({ rows: [filaReclamacion()], count: 1 });

    const logistica = await request(app)
      .get('/api/v1/admin/reclamaciones')
      .set('Cookie', cookieRol('admin_logistica'));
    expect(logistica.status).toBe(403);

    for (const rol of ['admin_gerente', 'admin_ventas']) {
      const res = await request(app)
        .get('/api/v1/admin/reclamaciones')
        .set('Cookie', cookieRol(rol));
      expect(res.status).toBe(200);
    }
  });

  it('lista con filtros por estado y fecha', async () => {
    reclamacionRepository.findAdmin.mockResolvedValue({ rows: [filaReclamacion()], count: 1 });

    const res = await request(app)
      .get(
        '/api/v1/admin/reclamaciones?estado=recibido,en_atencion&desde=2026-11-01&hasta=2026-11-30',
      )
      .set('Cookie', cookieRol('admin_ventas'));

    expect(res.status).toBe(200);
    expect(reclamacionRepository.findAdmin).toHaveBeenCalledWith(
      { estados: ['recibido', 'en_atencion'], desde: '2026-11-01', hasta: '2026-11-30' },
      { limit: 20, offset: 0 },
    );
    expect(res.body.data.items[0]).toMatchObject({
      codigo: 'LR-2026-000008',
      diasRestantes: expect.any(Number),
    });
    expect(res.body.data.pagination).toMatchObject({ total: 1, totalPages: 1 });
  });

  it('rechaza un rango de fechas invertido', async () => {
    const res = await request(app)
      .get('/api/v1/admin/reclamaciones?desde=2026-12-01&hasta=2026-11-01')
      .set('Cookie', cookieRol('admin_gerente'));
    expect(res.status).toBe(400);
  });

  it('registra la respuesta con el admin que respondió', async () => {
    reclamacionRepository.findById.mockResolvedValueOnce(filaReclamacion()).mockResolvedValueOnce(
      filaReclamacion({
        estado: 'respondido',
        respuesta: 'Te enviaremos un paquete nuevo sin costo esta semana.',
        respondidoPor: 2,
        respondidoPorUsuario: { id: 2, nombre: 'Luis', apellido: 'Mamani' },
        fechaRespuesta: new Date(),
      }),
    );

    const res = await request(app)
      .patch('/api/v1/admin/reclamaciones/8')
      .set('Cookie', cookieRol('admin_ventas'))
      .send({
        estado: 'respondido',
        respuesta: 'Te enviaremos un paquete nuevo sin costo esta semana.',
      });

    expect(res.status).toBe(200);
    expect(reclamacionRepository.update).toHaveBeenCalledWith(
      8,
      expect.objectContaining({ estado: 'respondido', respondidoPor: 2 }),
    );
    expect(res.body.data.respuesta).toMatchObject({ respondidoPor: 'Luis Mamani' });
    expect(res.body.data.diasRestantes).toBeNull();
  });

  it('responder exige el texto de la respuesta (400)', async () => {
    const res = await request(app)
      .patch('/api/v1/admin/reclamaciones/8')
      .set('Cookie', cookieRol('admin_gerente'))
      .send({ estado: 'respondido' });

    expect(res.status).toBe(400);
    expect(res.body.error.details[0].path).toBe('respuesta');
    expect(reclamacionRepository.update).not.toHaveBeenCalled();
  });

  it('404 si la hoja no existe', async () => {
    reclamacionRepository.findById.mockResolvedValue(null);
    const res = await request(app)
      .patch('/api/v1/admin/reclamaciones/999')
      .set('Cookie', cookieRol('admin_gerente'))
      .send({ estado: 'en_atencion' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('RECLAMACION_NO_ENCONTRADA');
  });
});
