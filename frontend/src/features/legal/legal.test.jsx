import { screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import i18n from '@/lib/i18n';
import { renderRuta, stubApi, stubNavegador } from '@/test/tienda';

beforeAll(stubNavegador);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const titulosDelIndice = (indice) =>
  within(indice)
    .getAllByRole('link')
    .map((a) => a.textContent);

describe('Términos y Condiciones', () => {
  it('muestra el documento con su fecha, el índice y las secciones exigidas', async () => {
    stubApi();
    renderRuta('/terminos');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Términos y Condiciones' }),
    ).toBeInTheDocument();
    expect(screen.getByText('24 de noviembre de 2026')).toHaveAttribute('datetime', '2026-11-24');
    expect(
      await screen.findByText(/Código de Protección y Defensa del Consumidor \(Ley 29571\)/),
    ).toBeInTheDocument();

    // Móvil: el índice va plegado antes del texto
    const indice = screen.getByRole('navigation', { name: 'Índice' });
    expect(indice.closest('details')).not.toHaveAttribute('open');
    expect(titulosDelIndice(indice)).toEqual([
      '1.Identificación del proveedor',
      '2.Objeto y aceptación',
      '3.Registro y cuenta',
      '4.Precios, monedas e impuestos',
      '5.Medios de pago',
      '6.Envíos',
      '7.Plazos de entrega y seguimiento',
      '8.Cambios y devoluciones',
      '9.Libro de Reclamaciones',
      '10.Propiedad intelectual',
      '11.Ley aplicable y jurisdicción',
    ]);
    expect(within(indice).getByRole('link', { name: /Libro de Reclamaciones/ })).toHaveAttribute(
      'href',
      '#reclamaciones',
    );

    // Contenido clave: IGV solo para Perú, plazos por zona, devoluciones y Libro de Reclamaciones
    expect(screen.getByText(/se aplica solo a los pedidos con destino a Perú/)).toBeInTheDocument();
    const plazos = screen.getByRole('table', {
      name: /Plazos estimados de entrega por zona/,
    });
    expect(
      within(plazos).getByRole('row', { name: 'Europa 12 a 18 días 4 a 7 días' }),
    ).toBeVisible();
    expect(screen.getByText(/14 días calendario desde la entrega/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Libro de Reclamaciones virtual' })).toHaveAttribute(
      'href',
      '/libro-reclamaciones',
    );
    expect(screen.getAllByRole('link', { name: 'contacto@kuski.pe' })[0]).toHaveAttribute(
      'href',
      'mailto:contacto@kuski.pe',
    );
    // Sin RUC definido todavía, no se muestra una línea vacía
    expect(screen.queryByText(/RUC:/)).not.toBeInTheDocument();
  });
});

it('en escritorio el índice es una columna lateral, no un desplegable', async () => {
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    matches: query.includes('min-width'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  stubApi();
  renderRuta('/terminos');

  const indice = await screen.findByRole('navigation', { name: 'Índice' });
  expect(indice.closest('aside')).not.toBeNull();
  expect(indice.closest('details')).toBeNull();
  expect(await within(indice).findAllByRole('link')).toHaveLength(11);
});

describe('Política de Privacidad', () => {
  it('muestra responsable, transferencia a Brasil, derechos ARCO y cookies reales', async () => {
    stubApi();
    renderRuta('/privacidad');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Política de Privacidad' }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/D\.S\. 016-2024-JUS/)).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 2, name: '8. Tus derechos (ARCO)' })).toBeVisible();
    expect(screen.getByText(/São Paulo, Brasil/)).toBeInTheDocument();
    expect(screen.getByText(/solo los 4 últimos dígitos/)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'privacidad@kuski.pe' })[0]).toHaveAttribute(
      'href',
      'mailto:privacidad@kuski.pe',
    );

    const cookies = screen.getByRole('table', { name: /Cookie y datos que la tienda guarda/ });
    expect(
      within(cookies)
        .getAllByRole('rowheader')
        .map((celda) => celda.textContent),
    ).toEqual(['kuski_token', 'kuski.idioma', 'kuski.moneda', 'kuski.carrito']);

    expect(screen.getByRole('link', { name: 'Términos y Condiciones' })).toHaveAttribute(
      'href',
      '/terminos',
    );
  });

  it('se traduce al idioma elegido', async () => {
    await i18n.changeLanguage('de');
    stubApi();
    renderRuta('/privacidad');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Datenschutzerklärung' }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/Datenschutz-Grundverordnung \(DSGVO\)/)).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Inhalt' })).toBeInTheDocument();
    expect(screen.getByText('24. November 2026')).toBeInTheDocument();
  });
});

it('el pie enlaza a las dos páginas', async () => {
  stubApi();
  renderRuta('/terminos');

  const pie = await screen.findByRole('navigation', { name: 'Kuski' });
  expect(within(pie).getByRole('link', { name: 'Términos y condiciones' })).toHaveAttribute(
    'href',
    '/terminos',
  );
  expect(within(pie).getByRole('link', { name: 'Privacidad' })).toHaveAttribute(
    'href',
    '/privacidad',
  );
});
