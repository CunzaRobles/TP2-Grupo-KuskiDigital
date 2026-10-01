import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { CarritoContext } from '@/features/carrito/carrito-context';
import { CurrencyProvider } from '@/lib/currency-provider';
import { productoApi, stubNavegador } from '@/test/tienda';
import { ProductCard } from './product-card';

// Carrito simulado: la tarjeta solo necesita agregar, abrir y el icono destino de la animación.
// QueryClient, moneda y data router: los usa el enlace a la ficha (useEnlaceProducto).
let carrito;
let producto;

const renderTarjeta = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <CurrencyProvider initialMoneda="PEN">
        <CarritoContext.Provider value={carrito}>
          <RouterProvider
            router={createMemoryRouter([
              { path: '/', element: <ProductCard producto={producto} /> },
            ])}
          />
        </CarritoContext.Provider>
      </CurrencyProvider>
    </QueryClientProvider>,
  );

beforeAll(stubNavegador);

beforeEach(() => {
  vi.clearAllMocks();
  carrito = { agregar: vi.fn(() => 1), abrir: vi.fn(), iconoCarritoRef: createRef() };
  producto = productoApi({
    nombre: 'Café Geisha de Quillabamba',
    precio: { moneda: 'PEN', simbolo: 'S/', monto: 65 },
    comunidad: { id: 1, nombre: 'Comunidad Cafetalera de Quillabamba', altitudMsnm: 1850 },
  });
});

describe('<ProductCard />', () => {
  it('UT-23: muestra nombre, precio, comunidad y altitud', () => {
    renderTarjeta();

    expect(screen.getByRole('link', { name: 'Café Geisha de Quillabamba' })).toHaveAttribute(
      'href',
      '/producto/cafe-geisha',
    );
    expect(screen.getByText(/S\/\s*65\.00/)).toBeInTheDocument();
    // La procedencia se muestra en la foto (hover) y bajo el nombre (pantallas táctiles)
    expect(screen.getAllByText('Comunidad Cafetalera de Quillabamba').length).toBeGreaterThan(0);
    // El separador de miles depende del locale (1,850 · 1.850 · 1 850)
    expect(screen.getAllByText(/^1\D?850 msnm$/).length).toBeGreaterThan(0);
  });
});
