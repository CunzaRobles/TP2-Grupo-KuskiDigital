// Forma única del carrito para la interfaz, venga de la API (con sesión) o de localStorage
// (invitado). Los montos siempre están en `moneda` (convertidos por el backend); un monto null
// significa "aún sin precio en esta moneda" y la interfaz muestra un skeleton.
//
// Carrito: { moneda, lineas, subtotal, totalUnidades }
// Línea:   { productoId, itemId, cantidad, nombre, slug, imagen, stock,
//            precioUnitario, subtotal, aviso, pendiente }

const redondear = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

const sumarSubtotales = (lineas) =>
  lineas.some((l) => l.subtotal === null)
    ? null
    : redondear(lineas.reduce((total, l) => total + l.subtotal, 0));

const contar = (lineas) => lineas.reduce((n, l) => n + l.cantidad, 0);

// El aviso se recalcula en el cliente: la cantidad pudo cambiar después de la respuesta.
const avisoDe = (disponible, stock, cantidad) => {
  if (!disponible) return 'NO_DISPONIBLE';
  return stock < cantidad ? 'STOCK_INSUFICIENTE' : null;
};

export const CARRITO_VACIO = { moneda: null, lineas: [], subtotal: 0, totalUnidades: 0 };

/**
 * Carrito de invitado: las líneas salen de localStorage (respuesta inmediata al editar) y los
 * precios de POST /carrito/invitado. `vigente` indica que la respuesta corresponde a los ítems
 * actuales: solo entonces un producto ausente se marca como no disponible.
 */
export function carritoInvitado(items, precios, { vigente = false } = {}) {
  const porProducto = new Map((precios?.items ?? []).map((l) => [l.productoId, l]));

  const lineas = items.map((item) => {
    const p = porProducto.get(item.productoId);
    const stock = p?.producto.stock ?? item.stock ?? 0;
    const precioUnitario = p?.precioUnitario ?? null;
    let subtotal = null;
    if (p)
      subtotal =
        p.cantidad === item.cantidad ? p.subtotal : redondear(precioUnitario * item.cantidad);

    return {
      productoId: item.productoId,
      itemId: null,
      cantidad: item.cantidad,
      nombre: p?.producto.nombre ?? item.nombre,
      slug: p?.producto.slug ?? item.slug,
      imagen:
        p?.producto.imagen ??
        (item.imagenUrl ? { url: item.imagenUrl, textoAlt: item.nombre } : null),
      stock,
      precioUnitario,
      subtotal,
      aviso: p
        ? avisoDe(p.aviso !== 'NO_DISPONIBLE', stock, item.cantidad)
        : vigente && precios
          ? 'NO_DISPONIBLE'
          : null,
      pendiente: false,
    };
  });

  return {
    moneda: precios?.moneda ?? null,
    lineas,
    subtotal: sumarSubtotales(lineas),
    totalUnidades: contar(lineas),
  };
}

/** Carrito de la API (GET /carrito y mutaciones) → forma de la interfaz. */
export function carritoServidor(dto) {
  if (!dto) return CARRITO_VACIO;
  const lineas = dto.items.map((l) => ({
    productoId: l.productoId,
    itemId: l.id,
    cantidad: l.cantidad,
    nombre: l.producto.nombre,
    slug: l.producto.slug,
    imagen: l.producto.imagen,
    stock: l.producto.stock,
    precioUnitario: l.precioUnitario,
    subtotal: l.subtotal,
    aviso: l.aviso,
    // Línea agregada de forma optimista: aún no tiene id para editarla.
    pendiente: l.id === null,
  }));
  return { moneda: dto.moneda, lineas, subtotal: dto.subtotal, totalUnidades: contar(lineas) };
}

// ── Actualizaciones optimistas sobre el DTO de la API (se reemplazan con la respuesta) ──

const conTotales = (dto, items) => ({
  ...dto,
  items,
  totalUnidades: contar(items),
  subtotal: sumarSubtotales(items),
});

const lineaConCantidad = (linea, cantidad) => ({
  ...linea,
  cantidad,
  subtotal: linea.precioUnitario === null ? null : redondear(linea.precioUnitario * cantidad),
  aviso:
    linea.aviso === 'NO_DISPONIBLE' ? linea.aviso : avisoDe(true, linea.producto.stock, cantidad),
});

/** Suma `cantidad` unidades del producto (tarjeta o ficha, con su precio en la moneda activa). */
export function dtoAgregar(dto, producto, cantidad) {
  const existente = dto.items.find((l) => l.productoId === producto.id);
  if (existente) {
    return conTotales(
      dto,
      dto.items.map((l) => (l === existente ? lineaConCantidad(l, l.cantidad + cantidad) : l)),
    );
  }

  const precioUnitario = producto.precio?.moneda === dto.moneda ? producto.precio.monto : null;
  const nueva = lineaConCantidad(
    {
      id: null,
      productoId: producto.id,
      producto: {
        id: producto.id,
        nombre: producto.nombre,
        slug: producto.slug,
        stock: producto.stock,
        imagen: producto.imagenes?.[0] ?? null,
      },
      precioUnitario,
      aviso: null,
    },
    cantidad,
  );
  return conTotales(dto, [...dto.items, nueva]);
}

export const dtoCambiarCantidad = (dto, productoId, cantidad) =>
  conTotales(
    dto,
    dto.items.map((l) => (l.productoId === productoId ? lineaConCantidad(l, cantidad) : l)),
  );

export const dtoQuitar = (dto, productoId) =>
  conTotales(
    dto,
    dto.items.filter((l) => l.productoId !== productoId),
  );
