import { shippingProvider } from '../adapters/shipping/index.js';
import * as carritoRepository from '../repositories/carrito.repository.js';
import * as productoRepository from '../repositories/producto.repository.js';
import { AppError } from '../utils/app-error.js';
import { aplicaIgv, calcularTotales, TASA_IGV } from '../utils/checkout-calculos.js';
import { convertirDesdePen, redondear } from '../utils/money.js';
import { obtenerTasa } from './precio.service.js';

// Agrupa ítems repetidos: [{ productoId, cantidad }] sin duplicados.
export const agruparItems = (items) => {
  const porProducto = new Map();
  for (const { productoId, cantidad } of items) {
    porProducto.set(productoId, (porProducto.get(productoId) ?? 0) + cantidad);
  }
  return [...porProducto].map(([productoId, cantidad]) => ({ productoId, cantidad }));
};

/**
 * Cruza los ítems con los productos y valida que todos existan, estén activos y tengan stock.
 * Lanza 409 STOCK_INSUFICIENTE (con details por producto) o 404 PRODUCTO_NO_ENCONTRADO.
 */
export const construirLineas = (items, productos) => {
  const porId = new Map(productos.map((p) => [p.id, p]));

  const faltantes = items.filter(({ productoId }) => !porId.get(productoId)?.activo);
  if (faltantes.length) {
    throw new AppError(
      404,
      'PRODUCTO_NO_ENCONTRADO',
      'Algún producto ya no está disponible',
      faltantes.map(({ productoId }) => ({ productoId })),
    );
  }

  const sinStock = items
    .map(({ productoId, cantidad }) => ({ producto: porId.get(productoId), cantidad }))
    .filter(({ producto, cantidad }) => producto.stock < cantidad);
  if (sinStock.length) {
    throw new AppError(
      409,
      'STOCK_INSUFICIENTE',
      `Stock insuficiente: ${sinStock.map(({ producto }) => producto.nombre).join(', ')}`,
      sinStock.map(({ producto, cantidad }) => ({
        productoId: producto.id,
        nombre: producto.nombre,
        disponible: producto.stock,
        solicitado: cantidad,
      })),
    );
  }

  return items.map(({ productoId, cantidad }) => {
    const p = porId.get(productoId);
    const precioUnitarioPen = Number(p.precioBasePen);
    return {
      productoId,
      nombre: p.nombre,
      slug: p.slug,
      cantidad,
      precioUnitarioPen,
      subtotalPen: redondear(precioUnitarioPen * cantidad),
      pesoG: p.pesoG * cantidad,
    };
  });
};

// Convierte cada parte y suma lo convertido: lo que ve el cliente siempre cuadra al céntimo.
const montosMoneda = ({ subtotalMoneda, envioPen, igvPen }, valorEnPen) => {
  const envio = convertirDesdePen(envioPen, valorEnPen);
  const igv = convertirDesdePen(igvPen, valorEnPen);
  return { subtotal: subtotalMoneda, envio, igv, total: redondear(subtotalMoneda + envio + igv) };
};

/**
 * Cálculo completo de la compra: subtotal, opciones de envío (según zona del país y peso),
 * IGV, tipo de cambio y total en la moneda elegida. Lo usan la cotización y el pedido.
 */
export const calcular = async ({ lineas, paisCodigo, moneda, metodoEnvio = 'estandar' }) => {
  const pesoTotalG = lineas.reduce((g, l) => g + l.pesoG, 0);
  const [tasa, { zona, opciones }] = await Promise.all([
    obtenerTasa(moneda),
    shippingProvider.cotizar({ paisCodigo, pesoG: pesoTotalG }),
  ]);
  const { valorEnPen } = tasa;
  const igvAplica = aplicaIgv(paisCodigo);

  const items = lineas.map((l) => ({
    productoId: l.productoId,
    nombre: l.nombre,
    slug: l.slug,
    cantidad: l.cantidad,
    precioUnitarioPen: l.precioUnitarioPen,
    subtotalPen: l.subtotalPen,
    precioUnitario: convertirDesdePen(l.precioUnitarioPen, valorEnPen),
    subtotal: convertirDesdePen(l.subtotalPen, valorEnPen),
  }));
  const subtotalPen = redondear(items.reduce((s, i) => s + i.subtotalPen, 0));
  const subtotalMoneda = redondear(items.reduce((s, i) => s + i.subtotal, 0));

  const opcionesEnvio = opciones.map((o) => {
    // IGV (18 %) sobre productos + envío, solo si el destino es Perú.
    const pen = calcularTotales(subtotalPen, o.costoPen, paisCodigo);
    const mon = montosMoneda({ subtotalMoneda, ...pen }, valorEnPen);
    return {
      tarifaEnvioId: o.tarifaEnvioId,
      metodo: o.metodo,
      transportista: o.transportista,
      diasMin: o.diasMin,
      diasMax: o.diasMax,
      costoPen: pen.envioPen,
      costo: mon.envio,
      igvPen: pen.igvPen,
      igv: mon.igv,
      totalPen: pen.totalPen,
      total: mon.total,
    };
  });

  const elegida = opcionesEnvio.find((o) => o.metodo === metodoEnvio);
  if (!elegida) {
    throw new AppError(
      422,
      'ENVIO_NO_DISPONIBLE',
      `El método de envío ${metodoEnvio} no está disponible para ${paisCodigo}`,
    );
  }

  return {
    paisCodigo,
    zona,
    moneda: tasa.moneda,
    simbolo: tasa.simbolo,
    tipoCambio: valorEnPen,
    pesoTotalG,
    items,
    igv: { aplica: igvAplica, tasa: igvAplica ? TASA_IGV : 0 },
    opcionesEnvio,
    metodoEnvio,
    resumen: {
      subtotal: subtotalMoneda,
      envio: elegida.costo,
      igv: elegida.igv,
      total: elegida.total,
      subtotalPen,
      envioPen: elegida.costoPen,
      igvPen: elegida.igvPen,
      totalPen: elegida.totalPen,
    },
  };
};

// POST /checkout/cotizar: usa los ítems enviados o, si no hay, el carrito del usuario.
export const cotizar = async ({ usuarioId, items, paisCodigo, moneda, metodoEnvio }) => {
  let solicitados = items;
  if (!solicitados?.length) {
    if (!usuarioId) {
      throw new AppError(
        400,
        'CARRITO_VACIO',
        'Envía los ítems a cotizar o inicia sesión para usar tu carrito',
      );
    }
    const carritoId = await carritoRepository.findOrCreateIdByUsuario(usuarioId);
    solicitados = (await carritoRepository.findItems(carritoId)).map(
      ({ productoId, cantidad }) => ({ productoId, cantidad }),
    );
    if (!solicitados.length) throw new AppError(400, 'CARRITO_VACIO', 'Tu carrito está vacío');
  }

  const agrupados = agruparItems(solicitados);
  const productos = await productoRepository.findByIds(agrupados.map((i) => i.productoId));
  const lineas = construirLineas(agrupados, productos);
  return calcular({ lineas, paisCodigo, moneda, metodoEnvio });
};
