import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Link } from './enlaces';
import { TransicionRuta } from './transicion-ruta';
import { useReducedMotion } from './use-reduced-motion';

// matchMedia controlable: `reducido` simula prefers-reduced-motion: reduce
function simularPreferencia(reducido) {
  const oyentes = new Set();
  const media = {
    get matches() {
      return reducido;
    },
    addEventListener: (_tipo, fn) => oyentes.add(fn),
    removeEventListener: (_tipo, fn) => oyentes.delete(fn),
  };
  vi.spyOn(window, 'matchMedia').mockReturnValue(media);
  return (valor) => {
    reducido = valor;
    oyentes.forEach((fn) => fn());
  };
}

// document.startViewTransition mínimo: ejecuta la actualización y resuelve sus promesas
function simularViewTransitions() {
  const iniciar = vi.fn((actualizar) => {
    const lista = Promise.resolve(actualizar?.());
    return { ready: lista, finished: lista, updateCallbackDone: lista, skipTransition() {} };
  });
  document.startViewTransition = iniciar;
  return iniciar;
}

const rutas = [
  {
    path: '/',
    Component: TransicionRuta,
    children: [
      { index: true, element: <Link to="/catalogo">Ir al catálogo</Link> },
      { path: 'catalogo', element: <h1>Catálogo</h1> },
    ],
  },
];

const renderRutas = () =>
  render(<RouterProvider router={createMemoryRouter(rutas, { initialEntries: ['/'] })} />);

afterEach(() => {
  vi.restoreAllMocks();
  delete document.startViewTransition;
});

describe('useReducedMotion', () => {
  it('sigue la preferencia del sistema y sus cambios', () => {
    const cambiar = simularPreferencia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    act(() => cambiar(true));
    expect(result.current).toBe(true);
  });
});

describe('transiciones entre rutas', () => {
  it('navega con View Transitions cuando el navegador las soporta', async () => {
    simularPreferencia(false);
    const iniciar = simularViewTransitions();
    renderRutas();

    await userEvent.click(screen.getByRole('link', { name: 'Ir al catálogo' }));

    expect(await screen.findByRole('heading', { name: 'Catálogo' })).toBeInTheDocument();
    expect(iniciar).toHaveBeenCalled();
  });

  it('no usa View Transitions con movimiento reducido', async () => {
    simularPreferencia(true);
    const iniciar = simularViewTransitions();
    renderRutas();

    await userEvent.click(screen.getByRole('link', { name: 'Ir al catálogo' }));

    expect(await screen.findByRole('heading', { name: 'Catálogo' })).toBeInTheDocument();
    expect(iniciar).not.toHaveBeenCalled();
  });

  it('sin soporte, funde la página nueva con Motion (fallback)', async () => {
    simularPreferencia(false);
    renderRutas();

    await userEvent.click(screen.getByRole('link', { name: 'Ir al catálogo' }));

    expect(await screen.findByRole('heading', { name: 'Catálogo' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Ir al catálogo' })).not.toBeInTheDocument();
  });
});
