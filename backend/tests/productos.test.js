import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('GET /api/productos', () => {
  it('responde 200 con la lista de productos', async () => {
    const res = await request(app).get('/api/productos');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        nombre: expect.any(String),
        precio: expect.any(Number),
        stock: expect.any(Number),
      }),
    );
  });
});
