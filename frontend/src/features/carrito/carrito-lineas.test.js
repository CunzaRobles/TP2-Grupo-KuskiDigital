import { describe, expect, it } from 'vitest';
import {
  carritoInvitado,
  carritoServidor,
  dtoAgregar,
  dtoCambiarCantidad,
  dtoQuitar,
} from './carrito-lineas';

const local = [
  {
    productoId: 1,
    slug: 'cafe',
    nombre: 'Café',
    imagenUrl: 'https://img/cafe.jpg',
    stock: 10,
    cantidad: 2,
  },
  { productoId: 2, slug: 'poncho', nombre: 'Poncho', imagenUrl: null, stock: 5, cantidad: 1 },
];

const lineaApi = (productoId, cantidad, precioUnitario, datos = {}) => ({
  id: null,
  productoId,
  cantidad,
  precioUnitario,
  subtotal: Math.round(precioUnitario * cantidad * 100) / 100,
  aviso: null,
  producto: {
    id: productoId,
    nombre: `P${productoId}`,
    slug: `p${productoId}`,
    stock: 10,
    imagen: null,
  },
  ...datos,
});

describe('carritoInvitado', () => {
  it('muestra las líneas al instante y sin precio hasta que responde la API', () => {
    const carrito = carritoInvitado(local, undefined);
    expect(carrito.totalUnidades).toBe(3);
    expect(carrito.subtotal).toBeNull();
    expect(carrito.lineas[0]).toMatchObject({
      nombre: 'Café',
      imagen: { url: 'https://img/cafe.jpg', textoAlt: 'Café' },
      precioUnitario: null,
      aviso: null,
    });
  });

  it('usa precios, stock y moneda de la API y recalcula si la cantidad cambió', () => {
    const precios = {
      moneda: 'USD',
      items: [
        lineaApi(1, 1, 9.33), // la API aún tenía 1 unidad; en localStorage hay 2
        lineaApi(2, 1, 93.33, { producto: { id: 2, nombre: 'Poncho', slug: 'poncho', stock: 0 } }),
      ],
    };
    const carrito = carritoInvitado(local, precios, { vigente: true });

    expect(carrito.moneda).toBe('USD');
    expect(carrito.lineas[0].subtotal).toBe(18.66);
    expect(carrito.lineas[1].aviso).toBe('STOCK_INSUFICIENTE');
    expect(carrito.subtotal).toBe(111.99);
  });

  it('marca como no disponible un producto que la API ya no devuelve', () => {
    const precios = { moneda: 'PEN', items: [lineaApi(1, 2, 35)] };
    expect(carritoInvitado(local, precios, { vigente: true }).lineas[1].aviso).toBe(
      'NO_DISPONIBLE',
    );
    expect(carritoInvitado(local, precios, { vigente: false }).lineas[1].aviso).toBeNull();
  });
});

describe('actualizaciones optimistas del carrito con sesión', () => {
  const dto = {
    moneda: 'EUR',
    subtotal: 17.28,
    totalUnidades: 2,
    items: [{ ...lineaApi(1, 2, 8.64), id: 7 }],
  };

  it('suma a una línea existente o crea una nueva con el precio de la tarjeta', () => {
    const producto = {
      id: 3,
      nombre: 'Quinua',
      slug: 'quinua',
      stock: 4,
      precio: { moneda: 'EUR', monto: 5 },
      imagenes: [{ url: 'https://img/q.jpg' }],
    };
    const conNueva = dtoAgregar(dto, producto, 2);
    expect(conNueva.items).toHaveLength(2);
    expect(conNueva.items[1]).toMatchObject({ id: null, cantidad: 2, subtotal: 10 });
    expect(conNueva).toMatchObject({ totalUnidades: 4, subtotal: 27.28 });

    const otraMoneda = dtoAgregar(dto, { ...producto, precio: { moneda: 'PEN', monto: 20 } }, 1);
    expect(otraMoneda.subtotal).toBeNull(); // el precio en EUR llega con la respuesta

    expect(dtoAgregar(dto, { id: 1 }, 1).items[0]).toMatchObject({ cantidad: 3, subtotal: 25.92 });
  });

  it('cambia cantidades, quita líneas y expone la forma de la interfaz', () => {
    expect(dtoCambiarCantidad(dto, 1, 5)).toMatchObject({ totalUnidades: 5, subtotal: 43.2 });
    expect(dtoQuitar(dto, 1)).toMatchObject({ items: [], totalUnidades: 0, subtotal: 0 });

    const carrito = carritoServidor(dto);
    expect(carrito.lineas[0]).toMatchObject({ itemId: 7, pendiente: false, productoId: 1 });
    expect(carritoServidor(dtoAgregar(dto, { id: 9, precio: null }, 1)).lineas[1].pendiente).toBe(
      true,
    );
  });
});
