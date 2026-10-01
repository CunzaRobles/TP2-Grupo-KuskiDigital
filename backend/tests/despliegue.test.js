import request from 'supertest';
import { describe, expect, it } from 'vitest';

const { default: app } = await import('../src/app.js');

// Ajustes para correr como función de Vercel detrás de su proxy.
describe('Despliegue en Vercel', () => {
  it('confía en el primer proxy (cookie secure e IP real)', () => {
    expect(app.get('trust proxy')).toBe(1);
  });

  it('permite el frontend de Vite en desarrollo, con credenciales', async () => {
    const res = await request(app).get('/api/v1/health').set('Origin', 'http://localhost:5173');

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('no permite orígenes desconocidos', async () => {
    const res = await request(app).get('/api/v1/health').set('Origin', 'https://otro-sitio.com');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('Swagger UI carga sus recursos desde el CDN, no desde node_modules', async () => {
    const pagina = await request(app).get('/api/v1/docs');
    expect(pagina.text).toMatch(
      /cdn\.jsdelivr\.net\/npm\/swagger-ui-dist@\d+\.\d+\.\d+\/swagger-ui-bundle\.js/,
    );
    expect(pagina.headers['content-security-policy']).toContain('https://cdn.jsdelivr.net');

    const init = await request(app).get('/api/v1/docs/swagger-init.js');
    expect(init.status).toBe(200);
    expect(init.headers['content-type']).toMatch(/javascript/);
    expect(init.text).toContain('/api/v1/docs/openapi.json');
  });
});
