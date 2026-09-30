import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { cafe, itemCarrito, poncho } from './helpers/fixtures.js';
import { cookieDe } from './helpers/sesion.js';

const carritoRepository = await import('../src/repositories/carrito.repository.js');
const productoRepository = await import('../src/repositories/producto.repository.js');
const { withTransaction } = await import('../src/repositories/transaction.repository.js');
const { default: app } = await import('../src/app.js');

const CARRITO_ID = 5;
const sesion = cookieDe({ id: 10 });

beforeEach(() => {
  carritoRepository.findOrCreateIdByUsuario.mockResolvedValue(CARRITO_ID);
  carritoRepository.findItems.mockResolvedValue([]);
  productoRepository.findByIds.mockImplementation(async (ids) =>
    [cafe, poncho].filter((p) => ids.includes(p.id)),
  );
});

describe('carrito sin sesión', () => {
  it('todas las rutas exigen autenticación', async () => {
    const respuestas = await Promise.all([
      request(app).get('/api/v1/carrito'),
      request(app).post('/api/v1/carrito/items').send({ productoId: 1 }),
      request(app).patch('/api/v1/carrito/items/1').send({ cantidad: 1 }),
      request(app).delete('/api/v1/carrito/items/1'),
      request(app).post('/api/v1/carrito/fusionar').send({ items: [] }),
    ]);
    expect(respuestas.map((r) => r.status)).toEqual([401, 401, 401, 401, 401]);
  });
});

describe('GET /api/v1/carrito', () => {
  it('devuelve ítems, totales y precios en la moneda pedida', async () => {
    carritoRepository.findItems.mockResolvedValue([
      itemCarrito(1, cafe, 2),
      itemCarrito(2, { ...poncho, stock: 1 }, 2),
    ]);

    const res = await request(app).get('/api/v1/carrito?moneda=USD').set('Cookie', sesion);

    expect(res.status).toBe(200);
    expect(carritoRepository.findOrCreateIdByUsuario).toHaveBeenCalledWith(10);
    const { data } = res.body;
    expect(data).toMatchObject({
      id: CARRITO_ID,
      moneda: 'USD',
      simbolo: '$',
      totalUnidades: 4,
      subtotalPen: 770,
      subtotal: 205.34, // 18.67 + 186.67
    });
    expect(data.items[0]).toMatchObject({
      id: 1,
      cantidad: 2,
      precioUnitarioPen: 35,
      precioUnitario: 9.33,
      subtotal: 18.67,
      aviso: null,
      producto: { slug: 'cafe-organico-kuski-250g', imagen: { url: 'https://img/x.jpg' } },
    });
    // Avisa si el stock bajó después de agregarlo
    expect(data.items[1].aviso).toBe('STOCK_INSUFICIENTE');
  });
});

describe('POST /api/v1/carrito/items', () => {
  it('agrega un producto nuevo (201)', async () => {
    const res = await request(app)
      .post('/api/v1/carrito/items')
      .set('Cookie', sesion)
      .send({ productoId: 1, cantidad: 2 });

    expect(res.status).toBe(201);
    expect(carritoRepository.createItem).toHaveBeenCalledWith({
      carritoId: CARRITO_ID,
      productoId: 1,
      cantidad: 2,
    });
  });

  it('suma la cantidad si el producto ya estaba en el carrito', async () => {
    carritoRepository.findItemByProducto.mockResolvedValue({ id: 3, productoId: 1, cantidad: 4 });

    await request(app)
      .post('/api/v1/carrito/items')
      .set('Cookie', sesion)
      .send({ productoId: 1, cantidad: 2 });

    expect(carritoRepository.updateCantidad).toHaveBeenCalledWith(3, 6);
    expect(carritoRepository.createItem).not.toHaveBeenCalled();
  });

  it('responde 409 STOCK_INSUFICIENTE si supera el stock', async () => {
    const res = await request(app)
      .post('/api/v1/carrito/items')
      .set('Cookie', sesion)
      .send({ productoId: 26, cantidad: 7 });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({
      code: 'STOCK_INSUFICIENTE',
      details: [{ productoId: 26, disponible: 6, solicitado: 7 }],
    });
  });

  it('responde 404 si el producto no existe o está inactivo', async () => {
    productoRepository.findByIds.mockResolvedValue([{ ...cafe, activo: false }]);

    const res = await request(app)
      .post('/api/v1/carrito/items')
      .set('Cookie', sesion)
      .send({ productoId: 1 });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PRODUCTO_NO_ENCONTRADO');
  });

  it('valida el cuerpo con Zod', async () => {
    const res = await request(app)
      .post('/api/v1/carrito/items')
      .set('Cookie', sesion)
      .send({ productoId: 'uno', cantidad: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.path)).toEqual(['productoId', 'cantidad']);
  });
});

describe('PATCH y DELETE /api/v1/carrito/items/:id', () => {
  it('cambia la cantidad de un ítem propio', async () => {
    carritoRepository.findItemById.mockResolvedValue({ id: 3, productoId: 1, cantidad: 1 });

    const res = await request(app)
      .patch('/api/v1/carrito/items/3')
      .set('Cookie', sesion)
      .send({ cantidad: 5 });

    expect(res.status).toBe(200);
    expect(carritoRepository.findItemById).toHaveBeenCalledWith(3, CARRITO_ID);
    expect(carritoRepository.updateCantidad).toHaveBeenCalledWith(3, 5);
  });

  it('responde 404 ITEM_NO_ENCONTRADO si el ítem no es del carrito del usuario', async () => {
    carritoRepository.findItemById.mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/v1/carrito/items/99')
      .set('Cookie', sesion)
      .send({ cantidad: 1 });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ITEM_NO_ENCONTRADO');
  });

  it('elimina un ítem', async () => {
    carritoRepository.findItemById.mockResolvedValue({ id: 3, productoId: 1, cantidad: 1 });

    const res = await request(app).delete('/api/v1/carrito/items/3').set('Cookie', sesion);

    expect(res.status).toBe(200);
    expect(carritoRepository.deleteItem).toHaveBeenCalledWith(3);
  });
});

describe('POST /api/v1/carrito/fusionar', () => {
  it('une el carrito de invitado en una transacción, ajusta al stock y omite lo no disponible', async () => {
    productoRepository.findParaVenta.mockResolvedValue([cafe, poncho]);
    carritoRepository.findItemByProducto.mockImplementation(async (_c, productoId) =>
      productoId === 1 ? { id: 3, productoId: 1, cantidad: 2 } : null,
    );

    const res = await request(app)
      .post('/api/v1/carrito/fusionar')
      .set('Cookie', sesion)
      .send({
        items: [
          { productoId: 1, cantidad: 1 },
          { productoId: 1, cantidad: 1 }, // duplicado en localStorage
          { productoId: 26, cantidad: 9 }, // solo hay 6
          { productoId: 777, cantidad: 1 }, // ya no existe
        ],
      });

    expect(res.status).toBe(200);
    expect(withTransaction).toHaveBeenCalledTimes(1);
    expect(carritoRepository.updateCantidad).toHaveBeenCalledWith(3, 4, { tx: 'mock' });
    expect(carritoRepository.createItem).toHaveBeenCalledWith(
      { carritoId: CARRITO_ID, productoId: 26, cantidad: 6 },
      { tx: 'mock' },
    );
    expect(res.body.data.ajustes).toEqual([
      { productoId: 26, motivo: 'STOCK_INSUFICIENTE', cantidadFinal: 6 },
      { productoId: 777, motivo: 'NO_DISPONIBLE', cantidadFinal: 0 },
    ]);
    expect(res.body.data.carrito).toHaveProperty('items');
  });
});

describe('POST /api/v1/carrito/invitado', () => {
  it('es público y devuelve precios, stock y avisos en la moneda pedida', async () => {
    productoRepository.findParaCarrito.mockResolvedValue([
      { ...cafe, imagenes: [{ url: 'https://img/cafe.jpg', textoAlt: 'Café' }] },
      { ...poncho, stock: 1, imagenes: [] },
    ]);

    const res = await request(app)
      .post('/api/v1/carrito/invitado?moneda=USD')
      .send({
        items: [
          { productoId: 1, cantidad: 1 },
          { productoId: 1, cantidad: 1 }, // duplicado en localStorage
          { productoId: 26, cantidad: 2 },
          { productoId: 777, cantidad: 1 }, // ya no existe: se omite
        ],
      });

    expect(res.status).toBe(200);
    expect(productoRepository.findParaCarrito).toHaveBeenCalledWith([1, 26, 777]);
    expect(res.body.data).toMatchObject({ id: null, moneda: 'USD', totalUnidades: 4 });
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.items[0]).toMatchObject({
      id: null,
      productoId: 1,
      cantidad: 2,
      precioUnitario: 9.33,
      aviso: null,
      producto: { slug: cafe.slug, imagen: { url: 'https://img/cafe.jpg', textoAlt: 'Café' } },
    });
    expect(res.body.data.items[1]).toMatchObject({ productoId: 26, aviso: 'STOCK_INSUFICIENTE' });
    expect(carritoRepository.findOrCreateIdByUsuario).not.toHaveBeenCalled();
  });

  it('acepta un carrito vacío sin consultar productos y valida los ítems', async () => {
    const vacio = await request(app).post('/api/v1/carrito/invitado').send({ items: [] });
    const invalido = await request(app)
      .post('/api/v1/carrito/invitado')
      .send({ items: [{ productoId: 1, cantidad: 0 }] });

    expect(vacio.status).toBe(200);
    expect(vacio.body.data).toMatchObject({ items: [], subtotal: 0, moneda: 'PEN' });
    expect(productoRepository.findParaCarrito).not.toHaveBeenCalled();
    expect(invalido.status).toBe(400);
  });
});
