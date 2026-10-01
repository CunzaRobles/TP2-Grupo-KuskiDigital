import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { CLAVE_CARRITO } from '@/features/carrito/carrito-storage';
import { json, llamadas, productoApi, renderRuta, stubApi, stubNavegador } from '@/test/tienda';

const detalle = (datos = {}) => ({
  ...productoApi(),
  stockMinimo: 2,
  comunidad: {
    id: 1,
    nombre: 'Comunidad Cafetalera de Quillabamba',
    razonSocial: 'Cooperativa Agraria Quillabamba',
    provincia: 'La Convención',
    region: 'Cusco',
    altitudMsnm: 1050,
    latitud: null,
    longitud: null,
    familiasBeneficiadas: 85,
    descripcion: 'Cafetales de ceja de selva.',
  },
  certificaciones: [{ id: 1, nombre: 'Orgánico', entidadEmisora: 'SENASA' }],
  resenas: {
    promedio: 4.5,
    total: 2,
    distribucion: { 5: 1, 4: 1, 3: 0, 2: 0, 1: 0 },
    items: [
      {
        id: 3,
        calificacion: 5,
        comentario: 'Aroma increíble',
        autor: 'Anna B.',
        paisCodigo: 'DE',
        creadoEn: '2026-09-01T10:00:00.000Z',
      },
    ],
  },
  ...datos,
});

const RELACIONADO = productoApi({ id: 2, nombre: 'Café Típica', slug: 'cafe-tipica' });

const api = (producto = detalle()) =>
  stubApi({
    'GET /productos/cafe-geisha': (url) => ({
      ...producto,
      precio:
        url.searchParams.get('moneda') === 'EUR'
          ? { moneda: 'EUR', simbolo: '€', monto: 16.05 }
          : producto.precio,
    }),
    'GET /productos/cafe-geisha/relacionados': [RELACIONADO],
    'POST /carrito/invitado': (_url, { items }) => ({
      id: null,
      moneda: 'PEN',
      items: items.map(({ productoId, cantidad }) => ({
        id: null,
        productoId,
        cantidad,
        precioUnitario: 65,
        subtotal: 65 * cantidad,
        aviso: null,
        producto: {
          id: productoId,
          nombre: producto.nombre,
          slug: producto.slug,
          stock: producto.stock,
          imagen: null,
        },
      })),
    }),
  });

beforeAll(stubNavegador);
afterEach(() => vi.unstubAllGlobals());

describe('ProductoPage', () => {
  it('muestra la ficha: migas, precio en la moneda elegida, certificaciones, stock y relacionados', async () => {
    window.localStorage.setItem('kuski.moneda', 'EUR');
    api();
    await renderRuta('/producto/cafe-geisha');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Café Geisha de Quillabamba' }),
    ).toBeInTheDocument();
    const migas = screen.getByRole('navigation', { name: 'Ruta de navegación' });
    expect(within(migas).getByRole('link', { name: 'Café' })).toHaveAttribute(
      'href',
      '/catalogo?categoria=cafe',
    );
    expect(screen.getAllByText(/16\.05/)[0]).toBeInTheDocument();
    expect(screen.getAllByText('Orgánico')[0]).toBeInTheDocument();
    expect(screen.getByText('Solo quedan 5 unidades')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '4.5 de 5 estrellas' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'El recorrido de este producto' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/en los cafetales de Comunidad Cafetalera de Quillabamba a 1,050 msnm/),
    ).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Café Típica' })).toHaveAttribute(
      'href',
      '/producto/cafe-tipica',
    );
  });

  it('cambia de foto con las miniaturas', async () => {
    const user = userEvent.setup();
    api();
    await renderRuta('/producto/cafe-geisha');

    const segunda = await screen.findByRole('button', { name: 'Ver imagen 2 de 2' });
    await user.click(segunda);
    expect(segunda).toHaveAttribute('aria-current', 'true');
    expect(screen.getByText('Imagen 2 de 2')).toBeInTheDocument();
  });

  it('muestra las pestañas Origen y Reseñas', async () => {
    const user = userEvent.setup();
    api();
    await renderRuta('/producto/cafe-geisha');

    await user.click(await screen.findByRole('tab', { name: 'Origen' }));
    const origen = screen.getByRole('tabpanel');
    expect(within(origen).getByText('Cooperativa Agraria Quillabamba')).toBeInTheDocument();
    expect(within(origen).getByRole('link', { name: /Ver todos los productos/ })).toHaveAttribute(
      'href',
      '/catalogo?comunidad=1',
    );

    // El resumen de calificación del panel de compra salta a la pestaña de reseñas
    await user.click(screen.getByRole('button', { name: /4\.5 de 5 estrellas/ }));
    const resenas = screen.getByRole('tabpanel');
    expect(within(resenas).getByText('Aroma increíble')).toBeInTheDocument();
    expect(within(resenas).getByText(/Alemania/)).toBeInTheDocument();
    expect(within(resenas).getByText('Basado en 2 reseñas')).toBeInTheDocument();
  });

  it('agrega la cantidad elegida al carrito y abre el drawer', async () => {
    const user = userEvent.setup();
    const fetchMock = api();
    await renderRuta('/producto/cafe-geisha');

    await user.click(await screen.findByRole('button', { name: 'Aumentar cantidad' }));
    await user.click(screen.getByRole('button', { name: 'Agregar al carrito' }));

    const drawer = await screen.findByRole('dialog', { name: 'Tu carrito' });
    expect(
      within(drawer).getByRole('link', { name: 'Café Geisha de Quillabamba' }),
    ).toBeInTheDocument();
    expect(
      within(drawer).getByRole('textbox', { name: 'Cantidad de Café Geisha de Quillabamba' }),
    ).toHaveValue('2');
    expect(JSON.parse(window.localStorage.getItem(CLAVE_CARRITO))).toMatchObject([
      { productoId: 1, cantidad: 2 },
    ]);
    await waitFor(() =>
      expect(llamadas(fetchMock, 'POST /carrito/invitado').at(-1).body).toEqual({
        items: [{ productoId: 1, cantidad: 2 }],
      }),
    );
    expect(await within(drawer).findAllByText(/130\.00/)).not.toHaveLength(0);
  });

  it('no permite comprar un producto agotado', async () => {
    api(detalle({ stock: 0, disponible: false }));
    await renderRuta('/producto/cafe-geisha');

    expect(await screen.findByRole('button', { name: 'Agregar al carrito' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Comprar ahora' })).toBeDisabled();
    expect(screen.getAllByText('Agotado')[0]).toBeInTheDocument();
  });

  it('muestra un 404 cuidado si el producto no existe', async () => {
    stubApi({
      'GET /productos/no-existe': json(404, {
        error: { code: 'PRODUCTO_NO_ENCONTRADO', message: 'El producto no existe' },
      }),
    });
    await renderRuta('/producto/no-existe');

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Este producto ya no está en la tienda',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver el catálogo/ })).toHaveAttribute(
      'href',
      '/catalogo',
    );
  });
});
