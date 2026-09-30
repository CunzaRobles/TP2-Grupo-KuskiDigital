import { describe, expect, it } from 'vitest';
import {
  CLAVE_CARRITO,
  agregarItem,
  contarUnidades,
  guardarCarrito,
  leerCarrito,
} from './carrito-storage';

const producto = (datos = {}) => ({
  id: 7,
  slug: 'cafe-quillabamba',
  nombre: 'Café de Quillabamba',
  precioBasePen: 48,
  stock: 3,
  imagenes: [{ url: 'https://img/cafe.jpg' }],
  ...datos,
});

describe('agregarItem', () => {
  it('agrega un producto nuevo con los datos para pintar el carrito', () => {
    const { items, agregado } = agregarItem([], producto());
    expect(agregado).toBe(1);
    expect(items).toEqual([
      {
        productoId: 7,
        slug: 'cafe-quillabamba',
        nombre: 'Café de Quillabamba',
        imagenUrl: 'https://img/cafe.jpg',
        precioBasePen: 48,
        stock: 3,
        cantidad: 1,
      },
    ]);
  });

  it('suma unidades al producto existente sin superar el stock', () => {
    let carrito = agregarItem([], producto(), 2).items;
    const resultado = agregarItem(carrito, producto(), 5);
    expect(resultado.agregado).toBe(1);
    expect(resultado.items[0].cantidad).toBe(3);

    carrito = resultado.items;
    const sinStock = agregarItem(carrito, producto());
    expect(sinStock.agregado).toBe(0);
    expect(sinStock.items).toBe(carrito);
  });

  it('no agrega productos agotados', () => {
    expect(agregarItem([], producto({ stock: 0 }))).toEqual({ items: [], agregado: 0 });
  });
});

describe('persistencia', () => {
  it('guarda y lee el carrito de localStorage', () => {
    const { items } = agregarItem([], producto(), 2);
    guardarCarrito(items);
    expect(leerCarrito()).toEqual(items);
    expect(contarUnidades(leerCarrito())).toBe(2);
  });

  it('ignora datos corruptos o ítems inválidos', () => {
    window.localStorage.setItem(CLAVE_CARRITO, '{no es json');
    expect(leerCarrito()).toEqual([]);

    window.localStorage.setItem(
      CLAVE_CARRITO,
      JSON.stringify([{ productoId: 1, cantidad: 2 }, { productoId: 'x', cantidad: 1 }, null]),
    );
    expect(leerCarrito()).toEqual([{ productoId: 1, cantidad: 2 }]);
  });
});
