// Filas de producto tal como las devuelve producto.repository (NUMERIC como string).
export const cafe = {
  id: 1,
  nombre: 'Café Orgánico Kuski 250 g',
  slug: 'cafe-organico-kuski-250g',
  precioBasePen: '35.00',
  stock: 42,
  pesoG: 250,
  activo: true,
};

export const poncho = {
  id: 26,
  nombre: 'Poncho Chinchero de Alpaca',
  slug: 'poncho-chinchero-alpaca',
  precioBasePen: '350.00',
  stock: 6,
  pesoG: 900,
  activo: true,
};

// Ítem de carrito con su producto incluido (carrito.repository.findItems).
export const itemCarrito = (id, producto, cantidad) => ({
  id,
  productoId: producto.id,
  cantidad,
  producto: { ...producto, imagenes: [{ url: 'https://img/x.jpg', textoAlt: producto.nombre }] },
});
