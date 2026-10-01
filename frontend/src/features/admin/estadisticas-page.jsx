import { useTranslation } from 'react-i18next';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { mensajeErrorAdmin as mensajeError } from './errores';
import { formatMoney, formatNumber } from '@/lib/format';
import { banderaPais, nombrePais } from '@/lib/paises';
import { useEstadisticas } from './api';
import { BarrasHorizontales } from './graficos';
import { Miniatura } from './productos-page';
import { PageHeader, Panel } from './ui';

function Cargando() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  );
}

/** Estadísticas de mercado: ventas por país de destino y ranking de productos (vistas SQL). */
export function EstadisticasPage() {
  const { t, i18n } = useTranslation();
  const idioma = i18n.language;
  const { data, isPending, isError, error } = useEstadisticas();
  const pct = (v) => formatNumber(v / 100, idioma, { style: 'percent', maximumFractionDigits: 1 });

  const totales = data?.totales;
  const cifras = [
    { clave: 'ingresos', valor: formatMoney(totales?.totalPen, 'PEN', idioma) },
    { clave: 'pedidos', valor: formatNumber(totales?.pedidos ?? 0, idioma) },
    { clave: 'paises', valor: formatNumber(totales?.paises ?? 0, idioma) },
    { clave: 'ticket', valor: formatMoney(totales?.ticketPromedioPen, 'PEN', idioma) },
  ];

  const sinVentas = data && data.ventasPorPais.length === 0;

  return (
    <>
      <title>{`${t('admin.secciones.estadisticas')} · Kuski`}</title>
      <PageHeader
        titulo={t('admin.estadisticasPage.titulo')}
        descripcion={t('admin.estadisticasPage.descripcion')}
      />
      {isError && <Alert variante="error" titulo={mensajeError(t, error)} />}

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border shadow-soft lg:grid-cols-4">
        {cifras.map((c) => (
          <div key={c.clave} className="grid gap-1 bg-card p-4">
            <dt className="text-sm text-muted-foreground">
              {t(`admin.estadisticasPage.totales.${c.clave}`)}
            </dt>
            <dd className="text-xl font-semibold tabular-nums">{isPending ? '—' : c.valor}</dd>
          </div>
        ))}
      </dl>

      {sinVentas ? (
        <EmptyState
          titulo={t('admin.estadisticasPage.sinVentas')}
          descripcion={t('admin.estadisticasPage.sinVentasDetalle')}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Panel
            titulo={t('admin.estadisticasPage.porPais')}
            descripcion={t('admin.estadisticasPage.porPaisDetalle')}
          >
            {isPending ? (
              <Cargando />
            ) : (
              <BarrasHorizontales
                filas={data.ventasPorPais.map((p) => ({
                  clave: p.pais,
                  prefijo: <span aria-hidden="true">{banderaPais(p.pais)}</span>,
                  etiqueta: nombrePais(p.pais, idioma),
                  valor: p.totalPen,
                  valorTexto: formatMoney(p.totalPen, 'PEN', idioma),
                  detalle: `${pct(p.participacionPct)} · ${t('admin.dashboardPage.pedidosN', { count: p.pedidos })}`,
                }))}
              />
            )}
          </Panel>

          <Panel
            titulo={t('admin.estadisticasPage.top')}
            descripcion={t('admin.estadisticasPage.topDetalle')}
          >
            {isPending ? (
              <Cargando />
            ) : (
              <BarrasHorizontales
                filas={data.topProductos.map((p) => ({
                  clave: p.productoId,
                  prefijo: (
                    <>
                      <span className="w-5 shrink-0 text-center font-serif text-muted-foreground tabular-nums">
                        {p.posicion}
                      </span>
                      <Miniatura imagen={p.imagen ? { url: p.imagen } : null} className="size-7" />
                    </>
                  ),
                  etiqueta: p.nombre,
                  valor: p.totalPen,
                  valorTexto: formatMoney(p.totalPen, 'PEN', idioma),
                  detalle: t('admin.estadisticasPage.unidades', { count: p.unidades }),
                }))}
              />
            )}
          </Panel>
        </div>
      )}
    </>
  );
}
