import { randomUUID } from 'node:crypto';
import { emailSender } from '../adapters/email/index.js';
import { paymentGateway } from '../adapters/payments/index.js';
import { shippingProvider } from '../adapters/shipping/index.js';
import * as carritoRepository from '../repositories/carrito.repository.js';
import * as direccionRepository from '../repositories/direccion.repository.js';
import * as pedidoRepository from '../repositories/pedido.repository.js';
import * as productoRepository from '../repositories/producto.repository.js';
import { withTransaction } from '../repositories/transaction.repository.js';
import * as usuarioRepository from '../repositories/usuario.repository.js';
import { AppError } from '../utils/app-error.js';
import { ROLES_ADMIN } from '../models/enums.js';
import { aNumero, convertirDesdePen, redondear } from '../utils/money.js';
import { agruparItems, calcular, construirLineas } from './cotizacion.service.js';
import * as direccionService from './direccion.service.js';

// KD-000001: el número visible sale del id del pedido.
export const formatearCodigo = (id) => `KD-${String(id).padStart(6, '0')}`;

// Pasos del tracking visual y el estado del pedido que completa cada uno.
const PASOS_TRACKING = [
  { clave: 'confirmado', estado: 'pagado' },
  { clave: 'preparando', estado: 'preparando' },
  { clave: 'en_transito', estado: 'en_transito' },
  { clave: 'entregado', estado: 'entregado' },
];
const ORDEN_ESTADOS = ['pendiente', 'pagado', 'preparando', 'en_transito', 'entregado'];

const pedidoNoEncontrado = () =>
  new AppError(404, 'PEDIDO_NO_ENCONTRADO', 'No encontramos ese pedido');

const resolverDireccion = async (usuarioId, { direccionId, direccion }) => {
  if (direccion) return direccion;
  const guardada = await direccionRepository.findByIdAndUsuario(direccionId, usuarioId);
  if (!guardada) {
    throw new AppError(404, 'DIRECCION_NO_ENCONTRADA', 'La dirección no existe en tu cuenta');
  }
  return guardada;
};

const datosPago = (pago) => ({
  metodo: pago.metodo,
  tarjeta: pago.tarjeta,
  telefono: pago.telefono,
  correoPaypal: pago.correoPaypal,
});

/**
 * Crea el pedido en UNA transacción: bloquea y valida stock, guarda el pedido con el snapshot
 * de dirección y precios, descuenta stock con su movimiento de kardex, procesa el pago con la
 * pasarela, crea el envío con su código de seguimiento, registra el historial de estados,
 * asigna el código KD-000001 y vacía el carrito. Si el pago se rechaza, se deshace todo.
 */
export const crearPedido = async (
  usuarioId,
  { direccionId, direccion, guardarDireccion = false, metodoEnvio, moneda, pago },
) => {
  // Yape y Plin solo operan en soles.
  if ((pago.metodo === 'yape' || pago.metodo === 'plin') && moneda !== 'PEN') {
    throw new AppError(
      422,
      'METODO_PAGO_NO_DISPONIBLE',
      'Yape y Plin solo están disponibles para pagos en soles (PEN)',
    );
  }

  const destino = await resolverDireccion(usuarioId, { direccionId, direccion });
  const paisCodigo = destino.paisCodigo.toUpperCase();

  const { codigo, resultadoPago } = await withTransaction(async (tx) => {
    const carritoId = await carritoRepository.findOrCreateIdByUsuario(usuarioId, tx);
    const itemsCarrito = await carritoRepository.findItems(carritoId, tx);
    if (!itemsCarrito.length) throw new AppError(400, 'CARRITO_VACIO', 'Tu carrito está vacío');

    // 1. Stock: bloquea las filas de producto hasta el commit y valida cantidades.
    const items = agruparItems(itemsCarrito);
    const productos = await productoRepository.findParaVenta(
      items.map((i) => i.productoId),
      tx,
    );
    const lineas = construirLineas(items, productos);

    // 2. Montos con los mismos cálculos que la cotización.
    const cotizacion = await calcular({ lineas, paisCodigo, moneda, metodoEnvio });
    const { resumen } = cotizacion;

    // 3. Pedido con snapshot de dirección y precios (código provisional hasta tener el id).
    const pedido = await pedidoRepository.create(
      {
        codigo: `TMP-${randomUUID().replace(/-/g, '').slice(0, 16)}`,
        usuarioId,
        estado: 'pendiente',
        moneda: cotizacion.moneda,
        tipoCambio: cotizacion.tipoCambio,
        subtotalPen: resumen.subtotalPen,
        costoEnvioPen: resumen.envioPen,
        igvPen: resumen.igvPen,
        totalPen: resumen.totalPen,
        totalMoneda: resumen.total,
        envioDestinatario: destino.nombreDestinatario,
        envioPaisCodigo: paisCodigo,
        envioCiudad: destino.ciudad,
        envioDireccion: destino.direccion,
        envioCodigoPostal: destino.codigoPostal ?? null,
        envioTelefono: destino.telefono ?? null,
      },
      tx,
    );
    const codigoPedido = formatearCodigo(pedido.id);
    await pedidoRepository.update(pedido.id, { codigo: codigoPedido }, tx);

    await pedidoRepository.createItems(
      lineas.map((l) => ({
        pedidoId: pedido.id,
        productoId: l.productoId,
        nombreProducto: l.nombre,
        cantidad: l.cantidad,
        precioUnitarioPen: l.precioUnitarioPen,
      })),
      tx,
    );
    await pedidoRepository.createEstado(
      { pedidoId: pedido.id, estado: 'pendiente', comentario: 'Pedido registrado' },
      tx,
    );

    // 4. Descuento de stock y kardex (salida por venta).
    for (const l of lineas) {
      const stockResultante = await productoRepository.descontarStock(l.productoId, l.cantidad, tx);
      if (stockResultante === null) {
        throw new AppError(409, 'STOCK_INSUFICIENTE', `Stock insuficiente: ${l.nombre}`, [
          { productoId: l.productoId, nombre: l.nombre, solicitado: l.cantidad },
        ]);
      }
      await pedidoRepository.createMovimientoInventario(
        {
          productoId: l.productoId,
          tipo: 'salida',
          cantidad: -l.cantidad,
          stockResultante,
          motivo: `Venta ${codigoPedido}`,
          pedidoId: pedido.id,
        },
        tx,
      );
    }

    // 5. Pago con la pasarela (simulada). Un rechazo deshace la transacción completa.
    const resultado = await paymentGateway.procesarPago({
      ...datosPago(pago),
      monto: resumen.total,
      moneda: cotizacion.moneda,
      referencia: codigoPedido,
    });
    if (!resultado.aprobado) {
      throw new AppError(402, 'PAGO_RECHAZADO', resultado.mensaje, {
        numeroOperacion: resultado.numeroOperacion,
        metodo: pago.metodo,
      });
    }
    await pedidoRepository.createPago(
      {
        pedidoId: pedido.id,
        metodo: pago.metodo,
        estado: 'aprobado',
        pasarela: resultado.pasarela,
        monto: resumen.total,
        moneda: cotizacion.moneda,
        numeroOperacion: resultado.numeroOperacion,
        tarjetaUltimos4: resultado.tarjetaUltimos4,
        mensajeRespuesta: resultado.mensaje.slice(0, 255),
      },
      tx,
    );

    // 6. Envío con código de seguimiento.
    const envio = await shippingProvider.generarEnvio({
      paisCodigo,
      metodo: metodoEnvio,
      pesoG: cotizacion.pesoTotalG,
      referencia: codigoPedido,
    });
    await pedidoRepository.createEnvio(
      {
        pedidoId: pedido.id,
        tarifaEnvioId: envio.tarifaEnvioId,
        transportista: envio.transportista,
        metodo: envio.metodo,
        codigoSeguimiento: envio.codigoSeguimiento,
        pesoTotalG: cotizacion.pesoTotalG,
        fechaEstimada: envio.fechaEstimada,
      },
      tx,
    );

    // 7. Pedido pagado (paso "Confirmado" del tracking) y carrito vacío.
    await pedidoRepository.update(pedido.id, { estado: 'pagado' }, tx);
    await pedidoRepository.createEstado(
      {
        pedidoId: pedido.id,
        estado: 'pagado',
        comentario: `Pago aprobado · operación ${resultado.numeroOperacion}`,
      },
      tx,
    );
    await carritoRepository.vaciar(carritoId, tx);

    // 8. Dirección nueva guardada en la cuenta, solo si el pedido se completó.
    if (direccion && guardarDireccion) {
      await direccionService.crear(usuarioId, direccion, tx);
    }

    return { codigo: codigoPedido, resultadoPago: resultado };
  });

  const detalle = await obtenerPedido({ id: usuarioId }, codigo);
  await notificarConfirmacion(usuarioId, detalle);

  return {
    ...detalle,
    pago: {
      ...detalle.pago,
      codigoAprobacion: resultadoPago.codigoAprobacion ?? detalle.pago.codigoAprobacion,
    },
  };
};

const notificarConfirmacion = async (usuarioId, pedido) => {
  try {
    const usuario = await usuarioRepository.findById(usuarioId);
    const lineas = pedido.items.map((i) => `  · ${i.cantidad} × ${i.nombreProducto}`);
    await emailSender.enviar({
      para: usuario.correo,
      asunto: `Confirmamos tu pedido ${pedido.codigo}`,
      texto: [
        `Hola ${usuario.nombre}, recibimos tu pago.`,
        '',
        ...lineas,
        '',
        `Total: ${pedido.moneda} ${pedido.montos.total.toFixed(2)}`,
        `Envío: ${pedido.envio.transportista} (${pedido.envio.metodo}), llegada estimada ${pedido.envio.fechaEstimada}`,
        `Seguimiento: ${pedido.envio.codigoSeguimiento}`,
      ].join('\n'),
    });
  } catch (error) {
    // El correo simulado nunca invalida un pedido ya pagado.
    console.error('No se pudo enviar el correo de confirmación:', error.message);
  }
};

const toTracking = (estado, historial) => {
  const fechaDe = (e) => historial.find((h) => h.estado === e)?.creadoEn ?? null;
  const indiceActual = ORDEN_ESTADOS.indexOf(estado);

  return {
    estadoActual: estado,
    cancelado: estado === 'cancelado',
    pasos: PASOS_TRACKING.map(({ clave, estado: e }) => {
      const fecha = fechaDe(e);
      const completado =
        estado === 'cancelado' ? fecha !== null : indiceActual >= ORDEN_ESTADOS.indexOf(e);
      return { clave, estado: e, completado, fecha };
    }),
    historial: historial.map(({ estado: e, comentario, creadoEn }) => ({
      estado: e,
      comentario,
      fecha: creadoEn,
    })),
  };
};

// Envío e IGV se convierten con el tipo de cambio congelado; el subtotal sale por diferencia
// con el total cobrado, así el desglose en la moneda del pedido cuadra al céntimo.
const convertirMontos = (p) => {
  const tipoCambio = Number(p.tipoCambio);
  const envio = convertirDesdePen(Number(p.costoEnvioPen), tipoCambio);
  const igv = convertirDesdePen(Number(p.igvPen), tipoCambio);
  const subtotal = redondear(Number(p.totalMoneda) - envio - igv);
  return {
    subtotalPen: Number(p.subtotalPen),
    envioPen: Number(p.costoEnvioPen),
    igvPen: Number(p.igvPen),
    totalPen: Number(p.totalPen),
    subtotal,
    envio,
    igv,
    total: Number(p.totalMoneda),
  };
};

// La pasarela simulada devuelve el código de Yape/Plin dentro del mensaje (la tabla pagos
// no tiene una columna propia); así sigue disponible al volver a consultar el pedido.
const codigoAprobacionDe = (mensaje) => /aprobación (\d{6})/.exec(mensaje ?? '')?.[1] ?? null;

export const toPedidoDTO = (p) => ({
  codigo: p.codigo,
  estado: p.estado,
  creadoEn: p.creadoEn,
  moneda: p.moneda,
  tipoCambio: Number(p.tipoCambio),
  montos: convertirMontos(p),
  direccion: {
    nombreDestinatario: p.envioDestinatario,
    paisCodigo: p.envioPaisCodigo,
    ciudad: p.envioCiudad,
    direccion: p.envioDireccion,
    codigoPostal: p.envioCodigoPostal,
    telefono: p.envioTelefono,
  },
  items: p.items.map((i) => ({
    productoId: i.productoId,
    nombreProducto: i.nombreProducto,
    slug: i.producto?.slug ?? null,
    imagen: i.producto?.imagenes?.[0] ?? null,
    cantidad: i.cantidad,
    precioUnitarioPen: Number(i.precioUnitarioPen),
    subtotalPen: aNumero(i.subtotalPen),
    // En la moneda del pedido, con el tipo de cambio congelado al comprar
    precioUnitario: convertirDesdePen(Number(i.precioUnitarioPen), Number(p.tipoCambio)),
    subtotal: convertirDesdePen(Number(i.subtotalPen), Number(p.tipoCambio)),
  })),
  pago: p.pago && {
    metodo: p.pago.metodo,
    estado: p.pago.estado,
    pasarela: p.pago.pasarela,
    monto: Number(p.pago.monto),
    moneda: p.pago.moneda,
    numeroOperacion: p.pago.numeroOperacion,
    tarjetaUltimos4: p.pago.tarjetaUltimos4,
    mensaje: p.pago.mensajeRespuesta,
    codigoAprobacion: codigoAprobacionDe(p.pago.mensajeRespuesta),
  },
  envio: p.envio && {
    transportista: p.envio.transportista,
    metodo: p.envio.metodo,
    codigoSeguimiento: p.envio.codigoSeguimiento,
    pesoTotalG: p.envio.pesoTotalG,
    fechaEstimada: p.envio.fechaEstimada,
    fechaEntrega: p.envio.fechaEntrega,
  },
  tracking: toTracking(p.estado, p.historialEstados ?? []),
});

export const listarMisPedidos = async (usuarioId, { page, limit }) => {
  const { rows, count } = await pedidoRepository.findByUsuario(usuarioId, {
    limit,
    offset: (page - 1) * limit,
  });

  return {
    items: rows.map((p) => ({
      codigo: p.codigo,
      estado: p.estado,
      creadoEn: p.creadoEn,
      moneda: p.moneda,
      totalMoneda: Number(p.totalMoneda),
      totalPen: Number(p.totalPen),
      paisCodigo: p.envioPaisCodigo,
      totalUnidades: p.items.reduce((n, i) => n + i.cantidad, 0),
      productos: p.items.map((i) => i.nombreProducto),
      envio: p.envio,
      // Pasos del tracking (sin fechas: el historial completo está en el detalle)
      tracking: toTracking(p.estado, []),
    })),
    pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
  };
};

// El cliente solo ve sus pedidos (404, no 403, para no revelar códigos ajenos); los admin, todos.
export const obtenerPedido = async (usuario, codigo) => {
  const pedido = await pedidoRepository.findByCodigo(codigo);
  if (!pedido) throw pedidoNoEncontrado();
  if (pedido.usuarioId !== usuario.id && !ROLES_ADMIN.includes(usuario.rol)) {
    throw pedidoNoEncontrado();
  }
  return toPedidoDTO(pedido);
};
