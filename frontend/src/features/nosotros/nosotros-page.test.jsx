import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { json, renderRuta, stubApi, stubNavegador } from '@/test/tienda';

const COMUNIDADES = [
  {
    id: 2,
    nombre: 'Comunidad Tejedora de Chinchero',
    provincia: 'Urubamba',
    altitudMsnm: 3760,
    totalProductos: 5,
  },
  {
    id: 1,
    nombre: 'Comunidad Cafetalera de Quillabamba',
    provincia: 'La Convención',
    altitudMsnm: 1050,
    totalProductos: 11,
  },
];

const TRAZABILIDAD = {
  comunidades: 8,
  familias: 450,
  productos: 44,
  paises: 31,
  altitudMinima: 1050,
  altitudMaxima: 3760,
};

const API = {
  'GET /comunidades': COMUNIDADES,
  'GET /estadisticas/trazabilidad': TRAZABILIDAD,
};

const MISION =
  'Empresa agroindustrial comprometida con la producción y comercialización de alimentos de la biodiversidad andina peruana mediante innovación y sostenibilidad, buscando el bienestar de agricultores y el respeto al medio ambiente.';

beforeAll(stubNavegador);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('NosotrosPage', () => {
  it('muestra el título, la misión y el CTA hacia el catálogo', async () => {
    stubApi(API);
    renderRuta('/nosotros');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Kuski Agroindustria S.A.' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('30 años transformando la biodiversidad andina en Cusco.'),
    ).toBeInTheDocument();

    const mision = screen.getByRole('region', { name: 'Misión' });
    expect(within(mision).getByText(MISION)).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Visión' })).toBeInTheDocument();

    const cierre = screen.getByRole('region', { name: 'Lleva el origen a tu mesa' });
    expect(within(cierre).getByRole('link', { name: 'Explorar catálogo' })).toHaveAttribute(
      'href',
      '/catalogo',
    );
  });

  it('muestra las comunidades y las cifras reales de la API', async () => {
    stubApi(API);
    renderRuta('/nosotros');

    const seccion = await screen.findByRole('region', { name: 'Nuestras comunidades' });
    expect(await within(seccion).findByText('450')).toBeInTheDocument();
    expect(within(seccion).getByText('8')).toBeInTheDocument();
    expect(within(seccion).getByText('De 1,050 a 3,760')).toBeInTheDocument();

    const lista = within(seccion).getByRole('list', {
      name: 'Comunidades productoras, de menor a mayor altitud',
    });
    expect(
      within(lista)
        .getAllByRole('heading', { level: 3 })
        .map((h) => h.textContent),
    ).toEqual(['Comunidad Cafetalera de Quillabamba', 'Comunidad Tejedora de Chinchero']);

    const valores = screen.getByRole('region', { name: 'Lo que nos guía' });
    expect(
      within(valores)
        .getAllByRole('heading', { level: 3 })
        .map((h) => h.textContent),
    ).toEqual(['Comercio justo', 'Trazabilidad', 'Sostenibilidad', 'Calidad']);
  });

  it('si fallan los datos, ofrece reintentar sin romper la página', async () => {
    const user = userEvent.setup();
    // 4xx: el QueryClient no reintenta solo, así el error se ve de inmediato
    let fallar = true;
    const error = () =>
      fallar ? json(404, { error: { code: 'NO_ENCONTRADO', message: 'x' } }) : TRAZABILIDAD;
    stubApi({ ...API, 'GET /estadisticas/trazabilidad': error });
    renderRuta('/nosotros');

    const seccion = await screen.findByRole('region', { name: 'Nuestras comunidades' });
    const reintentar = await within(seccion).findByRole('button', { name: 'Reintentar' });
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

    fallar = false;
    await user.click(reintentar);
    expect(await within(seccion).findByText('450')).toBeInTheDocument();
  });

  it('se enlaza desde la cabecera y el pie', async () => {
    stubApi(API);
    renderRuta('/catalogo');

    const cabecera = await screen.findByRole('navigation', { name: 'Navegación principal' });
    expect(within(cabecera).getByRole('link', { name: 'Nosotros' })).toHaveAttribute(
      'href',
      '/nosotros',
    );
    const pie = screen.getByRole('navigation', { name: 'Kuski' });
    expect(within(pie).getByRole('link', { name: 'Nosotros' })).toHaveAttribute(
      'href',
      '/nosotros',
    );
  });
});
