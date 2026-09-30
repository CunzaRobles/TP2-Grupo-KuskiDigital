import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney, formatNumber, localeDe } from '@/lib/format';
import { cn } from '@/lib/utils';

// Gráficos del panel. Una sola serie por gráfico (color --chart-1, validado en claro y oscuro):
// sin leyenda, el título dice qué se mide. Marcas finas, rejilla sutil y tooltip al pasar.

/**
 * Sparkline de un KPI (últimos 30 días): línea en el tono atenuado y el último punto en el
 * color de acento. Es decorativa para lectores de pantalla: el valor y la variación se leen
 * en la tarjeta.
 */
export function Sparkline({ valores = [], className }) {
  const id = useId();
  if (valores.length < 2) return <div className={cn('h-10', className)} />;
  const ancho = 120;
  const alto = 36;
  const max = Math.max(...valores, 1);
  const x = (i) => (i / (valores.length - 1)) * ancho;
  const y = (v) => alto - 3 - (v / max) * (alto - 6);
  const puntos = valores.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const ultimo = valores.length - 1;

  return (
    <svg
      viewBox={`-4 0 ${ancho + 8} ${alto}`}
      className={cn('h-10 w-full overflow-visible', className)}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.12" />
          <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${alto} ${puntos.join(' ')} ${ancho},${alto}`} fill={`url(#${id})`} />
      <polyline
        points={puntos.join(' ')}
        fill="none"
        stroke="var(--chart-muted)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={x(ultimo)}
        cy={y(valores[ultimo])}
        r="3.5"
        fill="var(--chart-1)"
        stroke="var(--card)"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Variación frente al periodo anterior: flecha + signo + texto (nunca solo color).
export function Variacion({ pct, positivoEsBueno = true }) {
  const { t, i18n } = useTranslation();
  if (pct === null || pct === undefined) {
    return (
      <span className="text-xs text-muted-foreground">
        {t('admin.dashboardPage.sinComparacion')}
      </span>
    );
  }
  const Icono = pct > 0 ? ArrowUpRight : pct < 0 ? ArrowDownRight : Minus;
  const bueno = pct === 0 ? null : pct > 0 === positivoEsBueno;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-semibold',
        bueno === true && 'text-success',
        bueno === false && 'text-destructive',
        bueno === null && 'text-muted-foreground',
      )}
    >
      <Icono className="size-3.5" aria-hidden="true" />
      {formatNumber(pct / 100, i18n.language, {
        style: 'percent',
        maximumFractionDigits: 1,
        signDisplay: 'exceptZero',
      })}
      <span className="font-normal text-muted-foreground">
        &nbsp;{t('admin.dashboardPage.vsMesAnterior')}
      </span>
    </span>
  );
}

export function KpiCard({
  etiqueta,
  valor,
  variacion,
  serie,
  pie,
  Icono,
  cargando,
  positivoEsBueno,
}) {
  return (
    <article className="grid content-between gap-3 rounded-xl border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground">{etiqueta}</h2>
        {Icono && <Icono className="size-4 text-muted-foreground" aria-hidden="true" />}
      </div>
      {cargando ? (
        <>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-full" />
        </>
      ) : (
        <>
          <div className="grid gap-1">
            <p className="font-sans text-3xl font-semibold tracking-tight tabular-nums">{valor}</p>
            {variacion !== undefined && (
              <Variacion pct={variacion} positivoEsBueno={positivoEsBueno} />
            )}
          </div>
          {serie ? <Sparkline valores={serie} /> : pie}
        </>
      )}
    </article>
  );
}

// Formato compacto para los ejes (S/ 12 mil, S/ 1,2 M).
const compacto = (valor, idioma) =>
  new Intl.NumberFormat(localeDe(idioma), {
    style: 'currency',
    currency: 'PEN',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(valor);

const nombreMes = (mes, idioma, formato = 'short') => {
  const [anio, m] = mes.split('-').map(Number);
  return new Intl.DateTimeFormat(localeDe(idioma), {
    month: formato,
    year: formato === 'long' ? 'numeric' : undefined,
  }).format(new Date(anio, m - 1, 1));
};

function TooltipMes({ active, payload }) {
  const { t, i18n } = useTranslation();
  if (!active || !payload?.length) return null;
  const { mes, ingresosPen, pedidos } = payload[0].payload;
  return (
    <div className="grid gap-1 rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-lift">
      <p className="font-semibold capitalize">{nombreMes(mes, i18n.language, 'long')}</p>
      <p className="flex items-center gap-2">
        <span className="size-2.5 rounded-sm bg-chart-1" aria-hidden="true" />
        {formatMoney(ingresosPen, 'PEN', i18n.language)}
      </p>
      <p className="text-muted-foreground">
        {t('admin.dashboardPage.pedidosN', { count: pedidos })}
      </p>
    </div>
  );
}

/**
 * Ingresos por mes (columnas). Con "Ver tabla" se muestra la misma serie como tabla: los datos
 * nunca dependen solo del gráfico.
 */
export function GraficoMensual({ serie = [], cargando }) {
  const { t, i18n } = useTranslation();
  const [verTabla, setVerTabla] = useState(false);

  if (cargando) return <Skeleton className="h-72 w-full" />;

  return (
    <div className="grid gap-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setVerTabla((v) => !v)}
          className="text-sm font-semibold text-link hover:underline"
          aria-pressed={verTabla}
        >
          {verTabla ? t('admin.dashboardPage.verGrafico') : t('admin.dashboardPage.verTabla')}
        </button>
      </div>
      {verTabla ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">{t('admin.dashboardPage.ingresosMensuales')}</caption>
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th scope="col" className="py-2 font-semibold">
                  {t('admin.dashboardPage.mes')}
                </th>
                <th scope="col" className="py-2 text-right font-semibold">
                  {t('admin.dashboardPage.ingresos')}
                </th>
                <th scope="col" className="py-2 text-right font-semibold">
                  {t('admin.secciones.pedidos')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {serie.map((m) => (
                <tr key={m.mes}>
                  <td className="py-2 capitalize">{nombreMes(m.mes, i18n.language, 'long')}</td>
                  <td className="py-2 text-right tabular-nums">
                    {formatMoney(m.ingresosPen, 'PEN', i18n.language)}
                  </td>
                  <td className="py-2 text-right tabular-nums">{m.pedidos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-72" role="img" aria-label={t('admin.dashboardPage.graficoAria')}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={serie}
              margin={{ top: 8, right: 4, bottom: 0, left: 4 }}
              barCategoryGap="30%"
            >
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeWidth={1} />
              <XAxis
                dataKey="mes"
                tickFormatter={(m) => nombreMes(m, i18n.language)}
                tickLine={false}
                axisLine={{ stroke: 'var(--chart-grid)' }}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(v) => compacto(v, i18n.language)}
                tickLine={false}
                axisLine={false}
                width={72}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <Tooltip
                content={<TooltipMes />}
                cursor={{ fill: 'var(--foreground)', fillOpacity: 0.04 }}
              />
              <Bar
                dataKey="ingresosPen"
                fill="var(--chart-1)"
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/**
 * Barras horizontales con etiqueta a la izquierda y valor al final (ranking, ventas por país).
 * HTML puro: se lee bien en móvil y con lector de pantalla (cada fila es texto).
 */
export function BarrasHorizontales({ filas, className }) {
  const max = Math.max(...filas.map((f) => f.valor), 1);
  return (
    <ul className={cn('grid gap-3', className)}>
      {filas.map((f) => (
        <li key={f.clave} className="grid gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              {f.prefijo}
              <span className="truncate font-semibold">{f.etiqueta}</span>
            </span>
            <span className="shrink-0 tabular-nums">{f.valorTexto}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 flex-1 rounded-sm bg-muted" aria-hidden="true">
              <div
                className="h-full rounded-sm bg-chart-1 transition-[width] duration-500 ease-andino"
                style={{ width: `${Math.max((f.valor / max) * 100, 1.5)}%` }}
              />
            </div>
            {f.detalle && (
              <span className="w-24 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                {f.detalle}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
