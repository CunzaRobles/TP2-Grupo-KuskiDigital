import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Providers } from './providers';
import { routes } from './router';

const renderRuta = (ruta) =>
  render(
    <Providers>
      <RouterProvider router={createMemoryRouter(routes, { initialEntries: [ruta] })} />
    </Providers>,
  );

beforeAll(() => {
  // jsdom no implementa matchMedia (lo usa Motion para prefers-reduced-motion)
  window.matchMedia ??= vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }));
  window.scrollTo = vi.fn();
});

describe('router', () => {
  it('muestra el home de la tienda con header y selectores', async () => {
    renderRuta('/');
    expect(
      await screen.findByRole('heading', { level: 1, name: /Lo mejor de los Andes/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Moneda' })).toHaveTextContent('PEN');
    expect(screen.getByRole('combobox', { name: 'Idioma' })).toHaveTextContent('ES');
  });

  it('muestra la página 404 en rutas desconocidas', async () => {
    renderRuta('/no-existe');
    expect(await screen.findByText('404')).toBeInTheDocument();
  });

  it('carga el panel admin en diferido y sin sesión lleva a su login', async () => {
    renderRuta('/admin/inventario');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Acceso al panel' }),
    ).toBeInTheDocument();
  });

  it('expone /design en desarrollo', async () => {
    renderRuta('/design');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Editorial andino' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Oscuro · admin').closest('.dark')).not.toBeNull();
  });
});
