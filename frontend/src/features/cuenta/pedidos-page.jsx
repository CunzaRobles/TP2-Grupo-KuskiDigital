import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Price } from '@/components/ui/price';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionError } from '@/features/home/section-heading';
import { EstadoPedido, Tracking } from '@/features/pedidos/tracking';
import { formatDate } from '@/lib/format';
import { Link } from '@/lib/motion/enlaces';
import { banderaPais, nombrePais } from '@/lib/paises';
import { cn } from '@/lib/utils';
import { usePedidos } from './api';

function PedidoCard({ pedido }) {
  const { t, i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;

  return (
    <article className="grid gap-5 rounded-2xl border bg-card p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1">
          <h2 className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-lg font-bold">{pedido.codigo}</span>
            <EstadoPedido estado={pedido.estado} />
          </h2>
          <p className="text-sm text-muted-foreground">
            {formatDate(pedido.creadoEn, idioma, { dateStyle: 'long' })} ·{' '}
            {t('carrito.unidades', { count: pedido.totalUnidades })} ·{' '}
            <span aria-hidden="true">{banderaPais(pedido.paisCodigo)} </span>
            {nombrePais(pedido.paisCodigo, idioma)}
          </p>
          <p className="line-clamp-1 text-sm">{pedido.productos.join(', ')}</p>
        </div>
        <Price amount={pedido.totalMoneda} currency={pedido.moneda} size="lg" />
      </div>
      <Tracking tracking={pedido.tracking} compacto />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm">
        {pedido.envio ? (
          <span className="text-muted-foreground">
            {pedido.envio.transportista} ·{' '}
            {t('pedidos.detalle.llegada', {
              fecha: formatDate(pedido.envio.fechaEstimada, idioma, { dateStyle: 'medium' }),
            })}
          </span>
        ) : (
          <span />
        )}
        <Link
          to={`/pedido/${pedido.codigo}`}
          className="inline-flex items-center gap-1.5 font-semibold text-link hover:underline"
          aria-label={t('cuenta.pedidos.verDetalleDe', { codigo: pedido.codigo })}
        >
          {t('cuenta.pedidos.verDetalle')}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

// Mis pedidos, del más reciente al más antiguo, cada uno con su tracking.
export function PedidosPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const { data, isPending, isError, isPlaceholderData, refetch } = usePedidos(page);
  const totalPages = data?.pagination.totalPages ?? 1;
  const irA = (p) => setParams(p > 1 ? { page: String(p) } : {});

  if (isPending) {
    return (
      <div className="grid gap-4" aria-hidden="true">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }
  if (isError) return <SectionError onRetry={refetch} />;
  if (data.items.length === 0) {
    return (
      <EmptyState
        objeto="canasta"
        titulo={t('cuenta.pedidos.vacio')}
        descripcion={t('cuenta.pedidos.vacioDetalle')}
        accion={
          <Button asChild>
            <Link to="/catalogo">{t('carrito.explorar')}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <section aria-label={t('cuenta.nav.pedidos')} className="grid gap-6">
      <title>{`${t('cuenta.nav.pedidos')} · Kuski`}</title>
      <ul className={cn('grid gap-4 transition-opacity', isPlaceholderData && 'opacity-60')}>
        {data.items.map((pedido) => (
          <li key={pedido.codigo}>
            <PedidoCard pedido={pedido} />
          </li>
        ))}
      </ul>
      {totalPages > 1 && (
        <nav
          aria-label={t('catalogo.paginacion.label')}
          className="flex items-center justify-center gap-3"
        >
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => irA(page - 1)}>
            <ChevronLeft aria-hidden="true" />
            {t('catalogo.paginacion.anterior')}
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums">
            {t('cuenta.pedidos.pagina', { page, total: totalPages })}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => irA(page + 1)}
          >
            {t('catalogo.paginacion.siguiente')}
            <ChevronRight aria-hidden="true" />
          </Button>
        </nav>
      )}
    </section>
  );
}
