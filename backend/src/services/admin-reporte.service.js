import { ESTADOS_PEDIDO } from '../models/enums.js';
import * as reporteRepository from '../repositories/reporte.repository.js';
import { redondear } from '../utils/money.js';

const MESES_SERIE = 12;
const DIAS_SPARKLINE = 30;
const TOP_PRODUCTOS = 10;
const STOCK_BAJO_DASHBOARD = 5;

// Variación porcentual frente al periodo anterior (null si no hay base de comparación).
const variacionPct = (actual, anterior) =>
  anterior > 0 ? redondear(((actual - anterior) / anterior) * 100) : null;

const ticket = (ingresos, pedidos) => (pedidos > 0 ? redondear(ingresos / pedidos) : 0);

const participacion = (parte, total) => (total > 0 ? redondear((parte / total) * 100) : 0);

/**
 * Dashboard: KPIs del mes (ingresos en PEN, pedidos, ticket promedio y stock bajo) con su
 * variación frente al mismo tramo del mes anterior y una serie diaria para los sparklines,
 * más la serie mensual de 12 meses para el gráfico.
 */
export const obtenerDashboard = async () => {
  const [kpis, mensual, diaria, porEstado, stockBajo, totalStockBajo] = await Promise.all([
    reporteRepository.findKpisMes(),
    reporteRepository.findSerieMensual(MESES_SERIE),
    reporteRepository.findSerieDiaria(DIAS_SPARKLINE),
    reporteRepository.findPedidosPorEstado(),
    reporteRepository.findStockBajo({ limit: STOCK_BAJO_DASHBOARD }),
    reporteRepository.countStockBajo(),
  ]);

  const ingresos = Number(kpis.ingresosPen);
  const ingresosAnterior = Number(kpis.ingresosPenAnterior);
  const serieDiaria = diaria.map((d) => ({
    dia: d.dia,
    ingresosPen: Number(d.ingresosPen),
    pedidos: d.pedidos,
  }));

  return {
    kpis: {
      ingresosMes: {
        valorPen: redondear(ingresos),
        variacionPct: variacionPct(ingresos, ingresosAnterior),
        serie: serieDiaria.map((d) => d.ingresosPen),
      },
      pedidosMes: {
        valor: kpis.pedidos,
        variacionPct: variacionPct(kpis.pedidos, kpis.pedidosAnterior),
        serie: serieDiaria.map((d) => d.pedidos),
      },
      ticketPromedio: {
        valorPen: ticket(ingresos, kpis.pedidos),
        variacionPct: variacionPct(
          ticket(ingresos, kpis.pedidos),
          ticket(ingresosAnterior, kpis.pedidosAnterior),
        ),
        serie: serieDiaria.map((d) => ticket(d.ingresosPen, d.pedidos)),
      },
      stockBajo: {
        valor: totalStockBajo,
        productos: stockBajo,
      },
    },
    serieMensual: mensual.map((m) => ({
      mes: m.mes,
      ingresosPen: Number(m.ingresosPen),
      pedidos: m.pedidos,
    })),
    serieDiaria,
    pedidosPorEstado: Object.fromEntries(
      ESTADOS_PEDIDO.map((e) => [e, porEstado.find((p) => p.estado === e)?.total ?? 0]),
    ),
  };
};

// Estadísticas de mercado: ventas por país y ranking de productos (vistas SQL).
export const obtenerEstadisticas = async () => {
  const [paises, productos] = await Promise.all([
    reporteRepository.findVentasPorPais(),
    reporteRepository.findTopProductos({ limit: TOP_PRODUCTOS }),
  ]);

  const totalPen = redondear(paises.reduce((s, p) => s + Number(p.totalPen), 0));
  const pedidos = paises.reduce((s, p) => s + p.pedidos, 0);

  return {
    totales: {
      totalPen,
      pedidos,
      paises: paises.length,
      ticketPromedioPen: ticket(totalPen, pedidos),
    },
    ventasPorPais: paises.map((p) => ({
      pais: p.pais,
      pedidos: p.pedidos,
      totalPen: Number(p.totalPen),
      participacionPct: participacion(Number(p.totalPen), totalPen),
    })),
    topProductos: productos.map((p, i) => ({
      posicion: i + 1,
      productoId: p.productoId,
      nombre: p.nombre,
      categoria: p.categoria,
      imagen: p.imagen,
      unidades: p.unidades,
      totalPen: Number(p.totalPen),
      participacionPct: participacion(Number(p.totalPen), totalPen),
    })),
  };
};
