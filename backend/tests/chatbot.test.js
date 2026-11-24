import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { cookieDe } from './helpers/sesion.js';

const pedidoRepository = await import('../src/repositories/pedido.repository.js');
const { default: app } = await import('../src/app.js');
const { crearChatbotLimiter } = await import('../src/middleware/rate-limit.js');

const enviar = (cuerpo, cookie) => {
  const req = request(app).post('/api/v1/chatbot/mensaje').send(cuerpo);
  return cookie ? req.set('Cookie', cookie) : req;
};

describe('POST /api/v1/chatbot/mensaje', () => {
  it('responde sin sesión con { intencion, texto, sugerencias, enlaces }', async () => {
    const res = await enviar({ mensaje: 'Medios de pago', idioma: 'en' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      intencion: 'medios_pago',
      texto: expect.stringContaining('PayPal'),
      sugerencias: expect.any(Array),
      enlaces: [{ texto: 'Payment methods in our Terms', url: '/terminos#pagos' }],
    });
  });

  it('valida el mensaje: vacío, de más de 300 caracteres o con idioma no soportado → 400', async () => {
    for (const cuerpo of [
      { mensaje: '   ' },
      { mensaje: 'a'.repeat(301) },
      { mensaje: 'hola', idioma: 'fr' },
      {},
    ]) {
      const res = await enviar(cuerpo);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    }
    expect((await enviar({ mensaje: 'a'.repeat(300) })).status).toBe(200);
  });

  it('con sesión solo informa los pedidos propios', async () => {
    pedidoRepository.findByCodigo.mockResolvedValue({
      codigo: 'KD-000123',
      usuarioId: 10,
      estado: 'entregado',
      historialEstados: [{ estado: 'entregado', creadoEn: '2026-11-22T15:00:00Z' }],
    });

    const propia = await enviar({ mensaje: 'KD-000123' }, cookieDe({ id: 10, rol: 'cliente' }));
    expect(propia.body.data.texto).toContain('Entregado');

    const ajena = await enviar({ mensaje: 'KD-000123' }, cookieDe({ id: 11, rol: 'cliente' }));
    expect(ajena.status).toBe(200);
    expect(ajena.body.data.texto).not.toContain('Entregado');
    expect(ajena.body.data.texto).toContain('No encontré el pedido KD-000123 en tu cuenta');
  });
});

describe('Límite de 30 mensajes por minuto por IP', () => {
  it('el mensaje 31 de la misma IP recibe 429', async () => {
    const mini = express();
    mini.post('/', crearChatbotLimiter(), (_req, res) => res.json({ ok: true }));

    for (let i = 0; i < 30; i += 1) expect((await request(mini).post('/')).status).toBe(200);
    const res = await request(mini).post('/');
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
  });
});
