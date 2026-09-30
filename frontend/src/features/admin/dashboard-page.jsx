import { AlertTriangle, Coins, Receipt, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useSesion } from '@/features/auth/api';
import { EstadoPedido } from '@/features/pedidos/tracking';
import { mensajeErrorAdmin as mensajeError } from './errores';
import { formatDate, formatMoney } from '@/lib/format';
import { useDashboard } from './api';
import { GraficoMensual, KpiCard } from './graficos';
import { puede } from './permisos';
import { PageHeader, Panel } from './ui';

// Estados que requieren acción del equipo (en este orden).
const COLA = ['pagado', 'preparando', 'en_transito'];

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { data: usuario } = useSesion();
  const { data, isPending, isError, error } = useDashboard();
  const idioma = i18n.language;
  const kpis = data?.kpis;

  return (
    <>
      <title>{`${t('admin.secciones.dashboard')} · Kuski`}</title>
      <PageHeader
        eyebrow={formatDate(new Date(), idioma, { month: 'long', year: 'numeric' })}
        titulo={t('admin.dashboardPage.saludo', { nombre: usuario?.nombre ?? '' })}
        descripcion={t('admin.dashboardPage.descripcion')}
      />

      {isError && <Alert variante="error" titulo={mensajeError(t, error)} />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          etiqueta={t('admin.dashboardPage.ingresosMes')}
          Icono={Coins}
          cargando={isPending}
          valor={formatMoney(kpis?.ingresosMes.valorPen, 'PEN', idioma)}
          variacion={kpis?.ingresosMes.variacionPct}
          serie={kpis?.ingresosMes.serie}
        />
        <KpiCard
          etiqueta={t('admin.dashboardPage.pedidosMes')}
          Icono={ShoppingBag}
          cargando={isPending}
          valor={kpis?.pedidosMes.valor}
          variacion={kpis?.pedidosMes.variacionPct}
          serie={kpis?.pedidosMes.serie}
        />
        <KpiCard
          etiqueta={t('admin.dashboardPage.ticketPromedio')}
          Icono={Receipt}
          cargando={isPending}
          valor={formatMoney(kpis?.ticketPromedio.valorPen, 'PEN', idioma)}
          variacion={kpis?.ticketPromedio.variacionPct}
          serie={kpis?.ticketPromedio.serie}
        />
        <KpiCard
          etiqueta={t('admin.dashboardPage.stockBajo')}
          Icono={AlertTriangle}
          cargando={isPending}
          valor={kpis?.stockBajo.valor}
          pie={
            <p className="text-xs text-muted-foreground">
              {kpis?.stockBajo.valor
                ? t('admin.dashboardPage.stockBajoDetalle')
                : t('admin.dashboardPage.stockBajoOk')}
            </p>
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Panel
          titulo={t('admin.dashboardPage.ingresosMensuales')}
          descripcion={t('admin.dashboardPage.ingresosMensualesDetalle')}
        >
          <GraficoMensual serie={data?.serieMensual} cargando={isPending} />
        </Panel>

        <div className="grid content-start gap-4">
          <Panel titulo={t('admin.dashboardPage.colaPedidos')}>
            <ul className="grid gap-2">
              {COLA.map((estado) => (
                <li key={estado} className="flex items-center justify-between gap-3">
                  <EstadoPedido estado={estado} />
                  <Link
                    to={`/admin/pedidos?estado=${estado}`}
                    className="text-sm font-semibold tabular-nums text-link hover:underline"
                    aria-label={t('admin.dashboardPage.verPedidosEstado', {
                      count: data?.pedidosPorEstado?.[estado] ?? 0,
                      estado: t(`pedidos.estados.${estado}`),
                    })}
                  >
                    {data?.pedidosPorEstado?.[estado] ?? '—'}
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel
            titulo={t('admin.dashboardPage.reponer')}
            acciones={
              puede(usuario?.rol, 'inventario') && (
                <Link
                  to="/admin/inventario?stock_bajo=true"
                  className="text-sm font-semibold text-link hover:underline"
                >
                  {t('admin.dashboardPage.verInventario')}
                </Link>
              )
            }
          >
            {kpis?.stockBajo.productos.length ? (
              <ul className="grid divide-y">
                {kpis.stockBajo.productos.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="grid min-w-0">
                      <span className="truncate font-semibold">{p.nombre}</span>
                      <span className="text-xs text-muted-foreground">
                        {p.sku} · {p.categoria}
                      </span>
                    </span>
                    <Badge variant={p.stock === 0 ? 'destructive' : 'maiz'}>
                      {t('admin.inventarioPage.stockN', { count: p.stock })}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                {isPending ? t('ui.cargando') : t('admin.dashboardPage.stockBajoOk')}
              </p>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
