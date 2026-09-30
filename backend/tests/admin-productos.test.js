import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cookieRol, registrarCuentas } from './helpers/admin.js';

const productoRepository = await import('../src/repositories/producto.repository.js');
const catalogoRepository = await import('../src/repositories/catalogo.repository.js');
const inventarioRepository = await import('../src/repositories/inventario.repository.js');
const { storageProvider } = await import('../src/adapters/storage/index.js');
const { default: app } = await import('../src/app.js');

const TX = { tx: 'mock' };
const gerente = cookieRol('admin_gerente');

// Fila de producto.repository.findAdminById
const productoDb = (extra = {}) => ({
  id: 50,
  sku: 'CAF-050',
  nombre: 'Café Geisha de Quillabamba',
  slug: 'cafe-geisha-de-quillabamba',
  descripcion: 'Notas florales.',
  precioBasePen: '89.90',
  stock: 12,
  stockMinimo: 5,
  pesoG: 250,
  destacado: false,
  activo: true,
  categoriaId: 1,
  comunidadId: 1,
  categoria: { id: 1, nombre: 'Café' },
  comunidad: { id: 1, nombre: 'Quillabamba' },
  imagenes: [],
  certificaciones: [{ id: 1, nombre: 'Orgánico' }],
  creadoEn: '2026-09-30T10:00:00.000Z',
  actualizadoEn: '2026-09-30T10:00:00.000Z',
  ...extra,
});

const nuevo = {
  sku: 'caf-050',
  nombre: 'Café Geisha de Quillabamba',
  descripcion: 'Notas florales.',
  precioBasePen: 89.9,
  pesoG: 250,
  categoriaId: 1,
  comunidadId: 1,
  certificacionIds: [1, 1],
  stockInicial: 12,
};

// Bytes mínimos que identifican cada formato.
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);

beforeEach(() => {
  registrarCuentas();
  catalogoRepository.findReferencias.mockResolvedValue({
    categoria: true,
    comunidad: true,
    certificacionIds: [1],
  });
  productoRepository.findConflictos.mockResolvedValue({ sku: false, slug: false });
  productoRepository.findAdminById.mockResolvedValue(productoDb());
});

describe('POST /api/v1/admin/productos', () => {
  it('crea el producto con slug automático y registra el stock inicial en el kardex', async () => {
    productoRepository.create.mockResolvedValue({ id: 50 });

    const res = await request(app)
      .post('/api/v1/admin/productos')
      .set('Cookie', gerente)
      .send(nuevo);

    expect(res.status).toBe(201);
    expect(productoRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        sku: 'CAF-050',
        slug: 'cafe-geisha-de-quillabamba',
        stock: 12,
        stockMinimo: 5,
        activo: true,
      }),
      TX,
    );
    expect(productoRepository.setCertificaciones).toHaveBeenCalledWith(50, [1], TX);
    expect(inventarioRepository.createMovimiento).toHaveBeenCalledWith(
      {
        productoId: 50,
        tipo: 'entrada',
        cantidad: 12,
        stockResultante: 12,
        motivo: 'Stock inicial',
        usuarioId: 1,
      },
      TX,
    );
    expect(res.body.data).toMatchObject({ id: 50, precioBasePen: 89.9, certificacionIds: [1] });
  });

  it('sin stock inicial no crea movimiento', async () => {
    productoRepository.create.mockResolvedValue({ id: 50 });
    const res = await request(app)
      .post('/api/v1/admin/productos')
      .set('Cookie', gerente)
      .send({ ...nuevo, stockInicial: 0 });
    expect(res.status).toBe(201);
    expect(inventarioRepository.createMovimiento).not.toHaveBeenCalled();
  });

  it('409 si el SKU ya existe', async () => {
    productoRepository.findConflictos.mockResolvedValue({ sku: true, slug: false });
    const res = await request(app)
      .post('/api/v1/admin/productos')
      .set('Cookie', gerente)
      .send(nuevo);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('SKU_EN_USO');
    expect(productoRepository.create).not.toHaveBeenCalled();
  });

  it('422 si la categoría no existe', async () => {
    catalogoRepository.findReferencias.mockResolvedValue({
      categoria: false,
      comunidad: true,
      certificacionIds: [1],
    });
    const res = await request(app)
      .post('/api/v1/admin/productos')
      .set('Cookie', gerente)
      .send(nuevo);
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('CATEGORIA_NO_EXISTE');
  });

  it.each([[{ precioBasePen: 0 }], [{ precioBasePen: 10.555 }], [{ sku: 'x' }], [{ pesoG: 0 }]])(
    'valida %o',
    async (cambio) => {
      const res = await request(app)
        .post('/api/v1/admin/productos')
        .set('Cookie', gerente)
        .send({ ...nuevo, ...cambio });
      expect(res.status).toBe(400);
    },
  );
});

describe('PUT y DELETE /api/v1/admin/productos/:id', () => {
  it('actualiza sin tocar el stock (el stock solo cambia con movimientos)', async () => {
    const res = await request(app)
      .put('/api/v1/admin/productos/50')
      .set('Cookie', gerente)
      .send({ precioBasePen: 95, destacado: true, stock: 999 });

    expect(res.status).toBe(200);
    expect(productoRepository.update).toHaveBeenCalledWith(
      50,
      { precioBasePen: 95, destacado: true },
      TX,
    );
    expect(productoRepository.setCertificaciones).not.toHaveBeenCalled();
  });

  it('404 si el producto no existe', async () => {
    productoRepository.findAdminById.mockResolvedValue(null);
    const res = await request(app)
      .put('/api/v1/admin/productos/404')
      .set('Cookie', gerente)
      .send({ nombre: 'Otro nombre' });
    expect(res.status).toBe(404);
  });

  it('DELETE es una baja lógica (los pedidos históricos lo siguen referenciando)', async () => {
    const res = await request(app).delete('/api/v1/admin/productos/50').set('Cookie', gerente);
    expect(res.status).toBe(200);
    expect(productoRepository.update).toHaveBeenCalledWith(50, { activo: false, destacado: false });
  });
});

describe('Imágenes de producto (Supabase Storage)', () => {
  const subir = (buffer, nombre = 'foto.png', tipo = 'image/png') =>
    request(app)
      .post('/api/v1/admin/productos/50/imagenes')
      .set('Cookie', gerente)
      .field('textoAlt', 'Grano tostado')
      .attach('imagen', buffer, { filename: nombre, contentType: tipo });

  it('sube al bucket y guarda la URL pública; la primera queda como principal', async () => {
    const subirSpy = vi.spyOn(storageProvider, 'subir');
    productoRepository.createImagen.mockImplementation(async (datos) => ({ id: 9, ...datos }));

    const res = await subir(PNG);

    expect(res.status).toBe(201);
    expect(subirSpy).toHaveBeenCalledWith({
      ruta: expect.stringMatching(/^50\/[0-9a-f-]{36}\.png$/),
      contenido: expect.any(Buffer),
      tipo: 'image/png',
    });
    expect(productoRepository.createImagen).toHaveBeenCalledWith({
      productoId: 50,
      url: expect.stringMatching(/^https:\/\/storage\.test\/productos\/50\//),
      textoAlt: 'Grano tostado',
      orden: 0,
      esPrincipal: true,
    });
    expect(res.body.data).toMatchObject({ id: 9, esPrincipal: true });
  });

  it('las siguientes van al final y no son principales', async () => {
    productoRepository.findAdminById.mockResolvedValue(
      productoDb({ imagenes: [{ id: 1, url: 'u', orden: 3, esPrincipal: true }] }),
    );
    productoRepository.createImagen.mockImplementation(async (datos) => ({ id: 9, ...datos }));

    const res = await subir(JPG, 'foto.jpg', 'image/jpeg');

    expect(res.status).toBe(201);
    expect(productoRepository.createImagen).toHaveBeenCalledWith(
      expect.objectContaining({ orden: 4, esPrincipal: false }),
    );
  });

  it('rechaza un archivo que no es imagen aunque declare image/png (415)', async () => {
    const res = await subir(Buffer.from('<script>alert(1)</script>'));
    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe('TIPO_ARCHIVO_INVALIDO');
    expect(productoRepository.createImagen).not.toHaveBeenCalled();
  });

  it('rechaza tipos no permitidos (415)', async () => {
    const res = await subir(Buffer.from('GIF89a'), 'x.gif', 'image/gif');
    expect(res.status).toBe(415);
  });

  it('rechaza imágenes de más de 5 MB (413)', async () => {
    const grande = Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024)]);
    const res = await subir(grande);
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('ARCHIVO_DEMASIADO_GRANDE');
  });

  it('400 si no se adjunta imagen', async () => {
    const res = await request(app)
      .post('/api/v1/admin/productos/50/imagenes')
      .set('Cookie', gerente)
      .field('textoAlt', 'x');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('IMAGEN_REQUERIDA');
  });

  it('si falla la base, borra el archivo subido para no dejarlo huérfano', async () => {
    const eliminarSpy = vi.spyOn(storageProvider, 'eliminar');
    productoRepository.createImagen.mockRejectedValue(new Error('db caída'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await subir(PNG);

    expect(res.status).toBe(500);
    expect(eliminarSpy).toHaveBeenCalledWith(expect.stringMatching(/^50\//));
  });

  it('marcar como principal desmarca la anterior en la misma transacción', async () => {
    productoRepository.findImagenes.mockResolvedValue([
      { id: 1, url: 'a', orden: 0, esPrincipal: true },
      { id: 2, url: 'b', orden: 1, esPrincipal: false },
    ]);

    const res = await request(app)
      .patch('/api/v1/admin/productos/50/imagenes/2')
      .set('Cookie', gerente)
      .send({ esPrincipal: true });

    expect(res.status).toBe(200);
    expect(productoRepository.desmarcarImagenPrincipal).toHaveBeenCalledWith(50, TX);
    expect(productoRepository.updateImagen).toHaveBeenCalledWith(2, { esPrincipal: true }, TX);
  });

  it('eliminar la principal promueve la siguiente y borra el archivo del bucket', async () => {
    const eliminarSpy = vi.spyOn(storageProvider, 'eliminar');
    productoRepository.findImagenes.mockResolvedValue([
      { id: 1, url: 'https://storage.test/productos/50/a.png', orden: 0, esPrincipal: true },
      { id: 2, url: 'https://images.unsplash.com/b', orden: 1, esPrincipal: false },
    ]);

    const res = await request(app)
      .delete('/api/v1/admin/productos/50/imagenes/1')
      .set('Cookie', gerente);

    expect(res.status).toBe(200);
    expect(productoRepository.deleteImagen).toHaveBeenCalledWith(1, TX);
    expect(productoRepository.updateImagen).toHaveBeenCalledWith(2, { esPrincipal: true }, TX);
    expect(eliminarSpy).toHaveBeenCalledWith('50/a.png');
  });

  it('las imágenes externas (Unsplash del seed) no se intentan borrar del bucket', async () => {
    const eliminarSpy = vi.spyOn(storageProvider, 'eliminar');
    productoRepository.findImagenes.mockResolvedValue([
      { id: 2, url: 'https://images.unsplash.com/b', orden: 0, esPrincipal: false },
    ]);

    const res = await request(app)
      .delete('/api/v1/admin/productos/50/imagenes/2')
      .set('Cookie', gerente);

    expect(res.status).toBe(200);
    expect(eliminarSpy).not.toHaveBeenCalled();
  });

  it('404 si la imagen no pertenece al producto', async () => {
    productoRepository.findImagenes.mockResolvedValue([]);
    const res = await request(app)
      .delete('/api/v1/admin/productos/50/imagenes/7')
      .set('Cookie', gerente);
    expect(res.status).toBe(404);
  });
});
