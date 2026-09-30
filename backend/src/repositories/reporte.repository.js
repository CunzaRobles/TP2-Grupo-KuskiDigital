import { QueryTypes } from 'sequelize';
import { sequelize } from '../models/index.js';

// Consultas de agregación del panel admin. Las fechas se agrupan en la hora de Lima para que
// "el mes" y "el día" coincidan con los de la empresa y no con UTC.
const ZONA = 'America/Lima';
// Pedidos que cuentan como venta (mismo criterio que las vistas v_ventas_por_pais y
// v_productos_mas_vendidos).
const ES_VENTA = `estado NOT IN ('pendiente', 'cancelado')`;

const select = (sql, replacements = {}) =>
  sequelize.query(sql, { replacements: { zona: ZONA, ...replacements }, type: QueryTypes.SELECT });

/**
 * KPIs del mes en curso frente al mismo tramo del mes anterior (del día 1 a hoy, a la misma hora),
 * para que la comparación sea justa aunque el mes no haya terminado.
 */
export const findKpisMes = async () => {
  const [fila] = await select(
    `WITH ahora AS (SELECT (NOW() AT TIME ZONE :zona) AS t),
     rangos AS (
       SELECT date_trunc('month', t)                          AS ini_actual,
              t                                               AS fin_actual,
              date_trunc('month', t) - INTERVAL '1 month'     AS ini_anterior,
              t - INTERVAL '1 month'                          AS fin_anterior
         FROM ahora
     ),
     ventas AS (
       SELECT total_pen, creado_en AT TIME ZONE :zona AS fecha
         FROM pedidos WHERE ${ES_VENTA}
     )
     SELECT
       COALESCE(SUM(v.total_pen) FILTER (WHERE v.fecha >= r.ini_actual   AND v.fecha <= r.fin_actual),   0) AS "ingresosPen",
       COUNT(*)                  FILTER (WHERE v.fecha >= r.ini_actual   AND v.fecha <= r.fin_actual)::int AS pedidos,
       COALESCE(SUM(v.total_pen) FILTER (WHERE v.fecha >= r.ini_anterior AND v.fecha <= r.fin_anterior), 0) AS "ingresosPenAnterior",
       COUNT(*)                  FILTER (WHERE v.fecha >= r.ini_anterior AND v.fecha <= r.fin_anterior)::int AS "pedidosAnterior"
       FROM rangos r LEFT JOIN ventas v ON TRUE
      GROUP BY r.ini_actual`,
  );
  return fila;
};

// Ingresos y pedidos de los últimos `meses` meses (incluido el actual), con ceros en los meses sin ventas.
export const findSerieMensual = (meses) =>
  select(
    `WITH meses AS (
       SELECT generate_series(
                date_trunc('month', NOW() AT TIME ZONE :zona) - make_interval(months => :meses - 1),
                date_trunc('month', NOW() AT TIME ZONE :zona),
                INTERVAL '1 month') AS mes
     )
     SELECT to_char(m.mes, 'YYYY-MM') AS mes,
            COALESCE(SUM(p.total_pen), 0) AS "ingresosPen",
            COUNT(p.id)::int AS pedidos
       FROM meses m
       LEFT JOIN pedidos p
         ON date_trunc('month', p.creado_en AT TIME ZONE :zona) = m.mes AND p.${ES_VENTA}
      GROUP BY m.mes
      ORDER BY m.mes`,
    { meses },
  );

// Serie diaria de los últimos `dias` días (para los sparklines de los KPIs).
export const findSerieDiaria = (dias) =>
  select(
    `WITH dias AS (
       SELECT generate_series(
                (NOW() AT TIME ZONE :zona)::date - (:dias - 1),
                (NOW() AT TIME ZONE :zona)::date,
                INTERVAL '1 day')::date AS dia
     )
     SELECT to_char(d.dia, 'YYYY-MM-DD') AS dia,
            COALESCE(SUM(p.total_pen), 0) AS "ingresosPen",
            COUNT(p.id)::int AS pedidos
       FROM dias d
       LEFT JOIN pedidos p
         ON (p.creado_en AT TIME ZONE :zona)::date = d.dia AND p.${ES_VENTA}
      GROUP BY d.dia
      ORDER BY d.dia`,
    { dias },
  );

// Pedidos por estado (todos los tiempos): cola de trabajo de logística.
export const findPedidosPorEstado = () =>
  select(`SELECT estado, COUNT(*)::int AS total FROM pedidos GROUP BY estado`);

// Vista v_productos_stock_bajo: productos activos con stock <= stock mínimo.
export const findStockBajo = ({ limit } = {}) =>
  select(
    `SELECT id, sku, nombre, stock, stock_minimo AS "stockMinimo", categoria
       FROM v_productos_stock_bajo
      ORDER BY stock ASC, nombre ASC
      ${limit ? 'LIMIT :limit' : ''}`,
    { limit: limit ?? null },
  );

export const countStockBajo = async () => {
  const [{ total }] = await select(`SELECT COUNT(*)::int AS total FROM v_productos_stock_bajo`);
  return total;
};

// Vista v_ventas_por_pais.
export const findVentasPorPais = () =>
  select(
    `SELECT pais, pedidos::int AS pedidos, total_pen AS "totalPen"
       FROM v_ventas_por_pais
      ORDER BY total_pen DESC, pais ASC`,
  );

// Vista v_productos_mas_vendidos, con la categoría y la imagen principal del producto.
export const findTopProductos = ({ limit }) =>
  select(
    `SELECT v.producto_id AS "productoId", v.nombre_producto AS nombre,
            v.unidades::int AS unidades, v.total_pen AS "totalPen",
            c.nombre AS categoria,
            (SELECT url FROM producto_imagenes i
              WHERE i.producto_id = v.producto_id AND i.es_principal LIMIT 1) AS imagen
       FROM v_productos_mas_vendidos v
       JOIN productos p ON p.id = v.producto_id
       JOIN categorias c ON c.id = p.categoria_id
      ORDER BY v.total_pen DESC, v.unidades DESC
      LIMIT :limit`,
    { limit },
  );
