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
    // La Home es una ruta diferida: la primera importación (en frío) puede pasar de 1 s
    expect(
      await screen.findByRole(
        'heading',
        { level: 1, name: 'Del valle a la puna' },
        { timeout: 5000 },
      ),
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
      await screen.findByRole('heading', { level: 1, name: 'Del valle a la puna' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Tienda').closest('.admin')).toBeNull();
    expect(screen.getByText('Admin · claro').closest('.admin')).not.toBeNull();
    expect(screen.getByText('Admin · oscuro').closest('.admin.dark')).not.toBeNull();
  });
});
