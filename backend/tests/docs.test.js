import request from 'supertest';
import { describe, expect, it } from 'vitest';

const { default: app } = await import('../src/app.js');

// Cada ruta de la API debe estar documentada en docs/openapi.yaml.
const RUTAS = {
  '/health': ['get'],
  '/auth/registro': ['post'],
  '/auth/login': ['post'],
  '/auth/logout': ['post'],
  '/auth/me': ['get'],
  '/productos': ['get'],
  '/productos/destacados': ['get'],
  '/productos/{slug}': ['get'],
  '/productos/{slug}/relacionados': ['get'],
  '/categorias': ['get'],
  '/comunidades': ['get'],
  '/certificaciones': ['get'],
  '/estadisticas/trazabilidad': ['get'],
  '/carrito': ['get'],
  '/carrito/items': ['post'],
  '/carrito/items/{id}': ['patch', 'delete'],
  '/carrito/fusionar': ['post'],
  '/carrito/invitado': ['post'],
  '/checkout/cotizar': ['post'],
  '/pedidos': ['post', 'get'],
  '/pedidos/{codigo}': ['get'],
  '/direcciones': ['get', 'post'],
  '/direcciones/{id}': ['patch', 'delete'],
  '/admin/dashboard': ['get'],
  '/admin/ventas': ['get'],
  '/admin/estadisticas': ['get'],
  '/admin/pedidos': ['get'],
  '/admin/pedidos/{codigo}': ['get'],
  '/admin/pedidos/{codigo}/estado': ['patch'],
  '/admin/productos': ['get', 'post'],
  '/admin/productos/{id}': ['get', 'put', 'delete'],
  '/admin/productos/{id}/imagenes': ['post'],
  '/admin/productos/{id}/imagenes/{imagenId}': ['patch', 'delete'],
  '/admin/inventario': ['get'],
  '/admin/inventario/movimientos': ['post'],
  '/admin/inventario/{id}/movimientos': ['get'],
  '/admin/categorias': ['get', 'post'],
  '/admin/categorias/{id}': ['put', 'delete'],
  '/admin/usuarios': ['get', 'post'],
  '/admin/usuarios/{id}': ['patch'],
  '/admin/buscar': ['get'],
};

describe('Documentación OpenAPI', () => {
  it('sirve Swagger UI en /api/v1/docs', async () => {
    const res = await request(app).get('/api/v1/docs/');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('swagger-ui');
    // Funciona por HTTP en desarrollo sin perder el resto de la CSP
    expect(res.headers['content-security-policy']).toContain("script-src 'self'");
    expect(res.headers['content-security-policy']).not.toContain('upgrade-insecure-requests');
  });

  it('expone la especificación y documenta todas las rutas', async () => {
    const res = await request(app).get('/api/v1/docs/openapi.json');

    expect(res.status).toBe(200);
    expect(res.body.openapi).toMatch(/^3\./);
    for (const [ruta, metodos] of Object.entries(RUTAS)) {
      expect(res.body.paths, ruta).toHaveProperty([ruta]);
      for (const metodo of metodos)
        expect(res.body.paths[ruta], `${metodo} ${ruta}`).toHaveProperty(metodo);
    }
  });

  it('todas las referencias $ref apuntan a componentes existentes', async () => {
    const { body: spec } = await request(app).get('/api/v1/docs/openapi.json');
    const refs = JSON.stringify(spec).match(/"\$ref":"#\/[^"]+"/g) ?? [];

    for (const ref of new Set(refs)) {
      const ruta = ref.slice(10, -1).split('/'); // "#/components/schemas/X" → [components, schemas, X]
      const destino = ruta.reduce((nodo, clave) => nodo?.[clave], spec);
      expect(destino, ref).toBeDefined();
    }
  });
});
