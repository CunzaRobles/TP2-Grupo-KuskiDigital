import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

// Los repositorios se simulan en tests/setup/mock-repositories.js.

const { ping } = await import('../src/repositories/health.repository.js');
const { default: app } = await import('../src/app.js');

describe('GET /api/v1/health', () => {
  it('responde 200 con status y db ok cuando la base responde', async () => {
    ping.mockResolvedValue();

    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { status: 'ok', db: 'ok' } });
  });

  it('responde 503 DB_UNAVAILABLE cuando la base no responde', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    ping.mockRejectedValue(new Error('timeout'));

    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('DB_UNAVAILABLE');
  });

  it('incluye las cabeceras de seguridad de helmet', async () => {
    ping.mockResolvedValue();

    const res = await request(app).get('/api/v1/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers).not.toHaveProperty('x-powered-by');
  });
});
