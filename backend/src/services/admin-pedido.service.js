import { emailSender } from '../adapters/email/index.js';
import * as inventarioRepository from '../repositories/inventario.repository.js';
import * as pedidoRepository from '../repositories/pedido.repository.js';
import * as productoRepository from '../repositories/producto.repository.js';
import { withTransaction } from '../repositories/transaction.repository.js';
import * as usuarioRepository from '../repositories/usuario.repository.js';
import { AppError } from '../utils/app-error.js';
import { redondear } from '../utils/money.js';
import { toPedidoDTO } from './pedido.service.js';

/**
 * Transiciones de estado permitidas desde el panel (tracking simulado). Un pedido avanza paso a
 * paso; se puede cancelar mientras no haya salido del almacén. Entregado y cancelado son finales.
 */
export const TRANSICIONES = {
  pendiente: ['cancelado'],
  pagado: ['preparando', 'cancelado'],
  preparando: ['en_transito', 'cancelado'],
  en_transito: ['entregado'],
  entregado: [],
  cancelado: [],
};

const COMENTARIOS = {
  preparando: 'Pedido en preparación en el almacén de Cusco',
  en_transito: 'Pedido entregado al transportista',
  entregado: 'Pedido entregado al cliente',
  cancelado: 'Pedido cancelado',
};

const AVISOS_CLIENTE = {
  preparando: 'Estamos preparando tu pedido en nuestro almacén de Cusco.',
  en_transito: 'Tu pedido ya está en camino.',
  entregado: 'Tu pedido fue entregado. ¡Gracias por apoyar a las comunidades productoras!',
  cancelado: 'Tu pedido fue cancelado y el pago se reembolsará por el mismo medio.',
};

const pedidoNoEncontrado = () =>
  new AppError(404, 'PEDIDO_NO_ENCONTRADO', 'No encontramos ese pedido');

// Fecha de hoy en Lima (YYYY-MM-DD) para envios.fecha_entrega.
const hoyEnLima = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());

const toFilaAdmin = (p) => ({
  codigo: p.codigo,
  estado: p.estado,
  creadoEn: p.creadoEn,
  moneda: p.moneda,
  totalMoneda: Number(p.totalMoneda),
  totalPen: Number(p.totalPen),
  paisCodigo: p.envioPaisCodigo,
  ciudad: p.envioCiudad,
  destinatario: p.envioDestinatario,
  unidades: (p.items ?? []).reduce((n, i) => n + i.cantidad, 0),
  cliente: p.usuario && {
    id: p.usuario.id,
    nombre: `${p.usuario.nombre} ${p.usuario.apellido}`,
    correo: p.usuario.correo,
  },
  pago: p.pago && {
    metodo: p.pago.metodo,
    estado: p.pago.estado,
    numeroOperacion: p.pago.numeroOperacion,
  },
  envio: p.envio && {
    transportista: p.envio.transportista,
    metodo: p.envio.metodo,
    codigoSeguimiento: p.envio.codigoSeguimiento,
  },
  transicionesPermitidas: TRANSICIONES[p.estado] ?? [],
});

const paginar = async (filtros, { page, limit }) => {
  const { rows, count } = await pedidoRepository.findAdmin(filtros, {
    limit,
    offset: (page - 1) * limit,
  });
  return {
    items: rows.map(toFilaAdmin),
    pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
  };
};

// Tabla de ventas: filas filtradas y paginadas, más el resumen de todo el filtro.
export const listarVentas = async ({ page, limit, ...filtros }) => {
  const [lista, resumen] = await Promise.all([
    paginar(filtros, { page, limit }),
    pedidoRepository.resumenAdmin(filtros),
  ]);
  const ingresosPen = redondear(Number(resumen?.ingresosPen ?? 0));
  const ventas = Number(resumen?.ventas ?? 0);
  return {
    ...lista,
    resumen: {
      pedidos: Number(resumen?.pedidos ?? 0),
      ventas,
      ingresosPen,
      ticketPromedioPen: ventas > 0 ? redondear(ingresosPen / ventas) : 0,
    },
  };
};

// Cola de pedidos (logística y atención): mismos filtros, sin resumen de ingresos.
export const listarPedidos = ({ page, limit, ...filtros }) => paginar(filtros, { page, limit });

// Detalle del pedido para el panel: el del cliente más sus datos y las transiciones posibles.
export const obtenerPedido = async (codigo) => {
  const pedido = await pedidoRepository.findByCodigo(codigo);
  if (!pedido) throw pedidoNoEncontrado();
  const cliente = await usuarioRepository.findById(pedido.usuarioId);
  return {
    ...toPedidoDTO(pedido),
    cliente: cliente && {
      id: cliente.id,
      nombre: `${cliente.nombre} ${cliente.apellido}`,
      correo: cliente.correo,
      telefono: cliente.telefono ?? null,
    },
    transicionesPermitidas: TRANSICIONES[pedido.estado] ?? [],
  };
};

// Devuelve al inventario las unidades de un pedido cancelado (entrada en el kardex).
const reponerStock = async (pedido, adminId, tx) => {
  for (const item of pedido.items) {
    const stockResultante = await productoRepository.incrementarStock(
      item.productoId,
      item.cantidad,
      tx,
    );
    await inventarioRepository.createMovimiento(
      {
        productoId: item.productoId,
        tipo: 'entrada',
        cantidad: item.cantidad,
        stockResultante,
        motivo: `Cancelación ${pedido.codigo}`,
        usuarioId: adminId,
        pedidoId: pedido.id,
      },
      tx,
    );
  }
};

/**
 * Cambia el estado del pedido (simula el tracking) en una transacción: valida la transición,
 * registra el historial en pedido_estados con el admin responsable y aplica los efectos:
 * - entregado → fecha de entrega del envío.
 * - cancelado → devuelve el stock (kardex) y marca el pago como reembolsado.
 * Después avisa al cliente con un correo (simulado).
 */
export const cambiarEstado = async (admin, codigo, { estado, comentario }) => {
  const usuarioId = await withTransaction(async (tx) => {
    const pedido = await pedidoRepository.findParaCambioEstado(codigo, tx);
    if (!pedido) throw pedidoNoEncontrado();

    const permitidas = TRANSICIONES[pedido.estado] ?? [];
    if (!permitidas.includes(estado)) {
      throw new AppError(
        409,
        'TRANSICION_INVALIDA',
        `Un pedido ${pedido.estado.replace('_', ' ')} no puede pasar a ${estado.replace('_', ' ')}`,
        { estadoActual: pedido.estado, permitidas },
      );
    }

    await pedidoRepository.update(pedido.id, { estado }, tx);
    await pedidoRepository.createEstado(
      {
        pedidoId: pedido.id,
        estado,
        comentario: comentario || COMENTARIOS[estado],
        usuarioId: admin.id,
      },
      tx,
    );

    if (estado === 'entregado') {
      await pedidoRepository.updateEnvio(pedido.id, { fechaEntrega: hoyEnLima() }, tx);
    }
    if (estado === 'cancelado') {
      await reponerStock(pedido, admin.id, tx);
      if (pedido.pago?.estado === 'aprobado') {
        await pedidoRepository.updatePago(pedido.id, { estado: 'reembolsado' }, tx);
      }
    }
    return pedido.usuarioId;
  });

  await notificarCliente(usuarioId, codigo, estado);
  return obtenerPedido(codigo);
};

const notificarCliente = async (usuarioId, codigo, estado) => {
  try {
    const usuario = await usuarioRepository.findById(usuarioId);
    if (!usuario) return;
    await emailSender.enviar({
      para: usuario.correo,
      asunto: `Tu pedido ${codigo}: ${estado.replace('_', ' ')}`,
      texto: `Hola ${usuario.nombre}. ${AVISOS_CLIENTE[estado]}\nSigue tu pedido en Mi cuenta → Pedidos.`,
    });
  } catch (error) {
    // El correo simulado nunca deshace un cambio de estado ya guardado.
    console.error('No se pudo enviar el aviso de estado:', error.message);
  }
};
