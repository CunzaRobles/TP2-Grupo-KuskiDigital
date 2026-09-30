// Carrito de invitado persistido en localStorage. Al iniciar sesión se fusiona con el del
// servidor (POST /carrito/fusionar). Solo guarda lo necesario para pintar el carrito: los
// precios en la moneda elegida se vuelven a pedir a la API.

export const CLAVE_CARRITO = 'kuski.carrito';

// Mismo límite que la API (carrito.service MAX_CANTIDAD_POR_ITEM).
export const MAX_POR_PRODUCTO = 99;

// Unidades que se pueden sumar a una línea sin superar el stock ni el máximo por producto.
export const unidadesAgregables = (actual, stock, cantidad) =>
  Math.max(0, Math.min(cantidad, Math.min(stock ?? 0, MAX_POR_PRODUCTO) - actual));

const esEnteroPositivo = (valor) => Number.isInteger(valor) && valor > 0;

const esItemValido = (item) =>
  item !== null &&
  typeof item === 'object' &&
  esEnteroPositivo(item.productoId) &&
  esEnteroPositivo(item.cantidad);

// localStorage puede no existir, lanzar (modo privado) o tener datos corruptos
export const leerCarrito = () => {
  try {
    const items = JSON.parse(window.localStorage.getItem(CLAVE_CARRITO) ?? '[]');
    return Array.isArray(items) ? items.filter(esItemValido) : [];
  } catch {
    return [];
  }
};

export const guardarCarrito = (items) => {
  try {
    window.localStorage.setItem(CLAVE_CARRITO, JSON.stringify(items));
  } catch {
    // sin persistencia: el carrito vive solo en memoria durante la visita
  }
};

const aItem = (producto) => ({
  productoId: producto.id,
  slug: producto.slug,
  nombre: producto.nombre,
  imagenUrl: producto.imagenes?.[0]?.url ?? null,
  precioBasePen: producto.precioBasePen,
  stock: producto.stock,
});

/**
 * Suma `cantidad` unidades del producto sin superar su stock.
 * Devuelve el carrito nuevo y cuántas unidades se agregaron realmente (0 si no había stock).
 */
export const agregarItem = (items, producto, cantidad = 1) => {
  const existente = items.find((i) => i.productoId === producto.id);
  const actual = existente?.cantidad ?? 0;
  const agregado = unidadesAgregables(actual, producto.stock, cantidad);
  if (agregado === 0) return { items, agregado };

  const item = { ...aItem(producto), cantidad: actual + agregado };
  return {
    items: existente
      ? items.map((i) => (i.productoId === producto.id ? item : i))
      : [...items, item],
    agregado,
  };
};

export const contarUnidades = (items) => items.reduce((total, i) => total + i.cantidad, 0);

// Fija la cantidad de un producto (1…99). Si no estaba en el carrito, no hace nada.
export const cambiarCantidadItem = (items, productoId, cantidad) =>
  items.map((i) =>
    i.productoId === productoId
      ? { ...i, cantidad: Math.min(Math.max(1, cantidad), MAX_POR_PRODUCTO) }
      : i,
  );

export const quitarItem = (items, productoId) => items.filter((i) => i.productoId !== productoId);

// Lo que la API necesita del carrito de invitado (precios y fusión al iniciar sesión).
export const aItemsApi = (items) =>
  items.map(({ productoId, cantidad }) => ({ productoId, cantidad }));
