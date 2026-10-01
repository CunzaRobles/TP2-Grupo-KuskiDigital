import { ArrowRight, Check, Copy, CreditCard, ImageOff, Mail, MapPin, Truck } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'react-router';
import { AndeanDivider } from '@/components/ui/andean-divider';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Price } from '@/components/ui/price';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { useSesion } from '@/features/auth/api';
import { SectionError } from '@/features/home/section-heading';
import { usePedido } from '@/features/cuenta/api';
import { formatDate, formatNumber } from '@/lib/format';
import { EASE_ANDINO } from '@/lib/motion';
import { Link } from '@/lib/motion/enlaces';
import { banderaPais, nombrePais } from '@/lib/paises';
import { EstadoPedido, Tracking } from './tracking';

function Tarjeta({ icono: Icono, titulo, children }) {
  return (
    <section className="grid content-start gap-3 rounded-2xl border bg-card p-6 shadow-soft">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Icono className="size-4 text-musgo" aria-hidden="true" />
        {titulo}
      </h2>
      <div className="grid gap-1 text-sm text-muted-foreground">{children}</div>
    </section>
  );
}

function Montos({ pedido }) {
  const { t, i18n } = useTranslation();
  const { montos, moneda } = pedido;
  const filas = [
    [t('checkout.resumen.subtotal'), montos.subtotal],
    [t('checkout.resumen.envio'), montos.envio],
    ...(montos.igv > 0 ? [[t('checkout.resumen.igv'), montos.igv]] : []),
  ];

  return (
    <dl className="grid gap-2 text-sm">
      {filas.map(([etiqueta, monto]) => (
        <div key={etiqueta} className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{etiqueta}</dt>
          <dd>
            <Price amount={monto} currency={moneda} />
          </dd>
        </div>
      ))}
      <div className="flex items-baseline justify-between gap-4 border-t pt-3">
        <dt className="font-semibold">{t('pedidos.detalle.totalPagado')}</dt>
        <dd>
          <Price amount={montos.total} currency={moneda} size="lg" />
        </dd>
      </div>
      {moneda !== 'PEN' && (
        <p className="text-right text-xs text-muted-foreground">
          {t('pedidos.detalle.tipoCambio', {
            moneda,
            valor: formatNumber(pedido.tipoCambio, i18n.resolvedLanguage, {
              minimumFractionDigits: 4,
            }),
          })}
        </p>
      )}
    </dl>
  );
}

function ConfirmacionSkeleton() {
  return (
    <div className="container-page grid gap-8 py-14" aria-hidden="true">
      <Skeleton className="h-16 w-2/3" />
      <Skeleton className="h-24 rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}

/**
 * Detalle del pedido (/pedido/:codigo). Recién pagado (state.recien) funciona como página de
 * confirmación: agradecimiento, código del pedido y, con Yape/Plin, el código de aprobación.
 */
export function ConfirmacionPage() {
  const { t, i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;
  const { codigo } = useParams();
  const { state } = useLocation();
  const { data: usuario } = useSesion();
  const { data: pedido, isPending, isError, error, refetch } = usePedido(codigo);
  const recien = Boolean(state?.recien);

  if (isPending) return <ConfirmacionSkeleton />;
  if (isError) {
    return (
      <div className="container-page py-section">
        {error?.status === 404 || error?.status === 400 ? (
          <EmptyState
            objeto="busqueda"
            headingLevel={1}
            titulo={t('pedidos.noEncontrado.titulo')}
            descripcion={t('pedidos.noEncontrado.descripcion')}
            accion={
              <Button asChild>
                <Link to="/cuenta">{t('pedidos.verMisPedidos')}</Link>
              </Button>
            }
          />
        ) : (
          <SectionError onRetry={refetch} />
        )}
      </div>
    );
  }

  const codigoAprobacion = state?.codigoAprobacion ?? pedido.pago?.codigoAprobacion;
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(pedido.codigo);
      toast.success(t('pedidos.detalle.copiado'));
    } catch {
      // Sin permiso de portapapeles: el código sigue visible para copiarlo a mano
    }
  };

  return (
    <div className="container-page grid gap-10 py-10 sm:py-14">
      <title>{`${t('pedidos.detalle.pedido', { codigo: pedido.codigo })} · Kuski`}</title>

      <header className="grid justify-items-start gap-5">
        {recien && (
          <motion.span
            initial={{ scale: 0.4, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.4, ease: EASE_ANDINO }}
            className="flex size-14 items-center justify-center rounded-full bg-musgo text-white shadow-lift"
            aria-hidden="true"
          >
            <Check className="size-7" strokeWidth={3} />
          </motion.span>
        )}
        <div className="grid gap-3">
          <p className="eyebrow text-link">
            {recien ? t('pedidos.confirmacion.eyebrow') : t('pedidos.detalle.eyebrow')}
          </p>
          <h1 className="text-h1">
            {recien
              ? t('pedidos.confirmacion.titulo', { nombre: usuario?.nombre ?? '' })
              : t('pedidos.detalle.pedido', { codigo: pedido.codigo })}
          </h1>
          {recien && (
            <p className="flex items-center gap-2 text-lead text-muted-foreground">
              <Mail className="size-5 shrink-0" aria-hidden="true" />
              {t('pedidos.confirmacion.correo', { correo: usuario?.correo ?? '' })}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">{t('pedidos.detalle.codigo')}</span>
          <span
            className="rounded-lg bg-puna px-3 py-1.5 font-mono text-lg font-bold tracking-wider text-white"
            data-testid="codigo-pedido"
          >
            {pedido.codigo}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={copiar}
            aria-label={t('pedidos.detalle.copiar')}
          >
            <Copy aria-hidden="true" />
          </Button>
          <EstadoPedido estado={pedido.estado} />
          <span className="text-sm text-muted-foreground">
            {formatDate(pedido.creadoEn, idioma, { dateStyle: 'long', timeStyle: 'short' })}
          </span>
        </div>
      </header>

      <section
        aria-labelledby="tracking-titulo"
        className="grid gap-6 rounded-2xl border bg-card p-6 shadow-card sm:p-8"
      >
        <h2 id="tracking-titulo" className="text-h4">
          {t('pedidos.tracking.titulo')}
        </h2>
        <Tracking tracking={pedido.tracking} />
        {pedido.envio && (
          <p className="text-sm text-muted-foreground">
            {t('pedidos.detalle.llegada', {
              fecha: formatDate(pedido.envio.fechaEstimada, idioma, { dateStyle: 'long' }),
            })}
          </p>
        )}
      </section>

      <AndeanDivider variant="ornament" />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <section
          aria-labelledby="productos-titulo"
          className="grid gap-6 rounded-2xl border bg-card p-6 shadow-soft"
        >
          <h2 id="productos-titulo" className="text-h4">
            {t('pedidos.detalle.productos')}
          </h2>
          <ul className="grid divide-y">
            {pedido.items.map((item) => (
              <li key={item.productoId} className="flex items-center gap-4 py-4 first:pt-0">
                <span className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.imagen ? (
                    <img
                      src={item.imagen.url}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : (
                    <ImageOff className="absolute inset-0 m-auto size-5 text-muted-foreground" />
                  )}
                </span>
                <span className="grid min-w-0 flex-1 gap-0.5">
                  {item.slug ? (
                    <Link to={`/producto/${item.slug}`} className="font-semibold hover:text-link">
                      {item.nombreProducto}
                    </Link>
                  ) : (
                    <span className="font-semibold">{item.nombreProducto}</span>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {item.cantidad} ×{' '}
                    <Price
                      amount={item.precioUnitario}
                      currency={pedido.moneda}
                      className="font-normal"
                    />
                  </span>
                </span>
                <Price amount={item.subtotal} currency={pedido.moneda} />
              </li>
            ))}
          </ul>
          <Montos pedido={pedido} />
        </section>

        <div className="grid gap-6">
          {pedido.pago && (
            <Tarjeta icono={CreditCard} titulo={t('pedidos.detalle.pago')}>
              <p className="font-medium text-foreground">
                {t(`checkout.pago.metodos.${pedido.pago.metodo}`)}
                {pedido.pago.tarjetaUltimos4 && ` •••• ${pedido.pago.tarjetaUltimos4}`}
              </p>
              {codigoAprobacion && (
                <p>
                  {t('pedidos.detalle.codigoAprobacion')}{' '}
                  <strong
                    className="font-mono text-base text-foreground"
                    data-testid="codigo-aprobacion"
                  >
                    {codigoAprobacion}
                  </strong>
                </p>
              )}
              <p>{t('pedidos.detalle.operacion', { numero: pedido.pago.numeroOperacion })}</p>
            </Tarjeta>
          )}
          {pedido.envio && (
            <Tarjeta icono={Truck} titulo={t('pedidos.detalle.envio')}>
              <p className="font-medium text-foreground">
                {pedido.envio.transportista} · {t(`checkout.metodo.${pedido.envio.metodo}`)}
              </p>
              <p>
                {t('pedidos.detalle.seguimiento')}{' '}
                <span className="font-mono text-foreground">{pedido.envio.codigoSeguimiento}</span>
              </p>
            </Tarjeta>
          )}
          <Tarjeta icono={MapPin} titulo={t('pedidos.detalle.direccion')}>
            <p className="font-medium text-foreground">{pedido.direccion.nombreDestinatario}</p>
            <p>
              {pedido.direccion.direccion}, {pedido.direccion.ciudad}
              {pedido.direccion.codigoPostal && ` ${pedido.direccion.codigoPostal}`}
            </p>
            <p>
              <span aria-hidden="true">{banderaPais(pedido.direccion.paisCodigo)} </span>
              {nombrePais(pedido.direccion.paisCodigo, idioma)}
            </p>
          </Tarjeta>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/catalogo">
            {t('carrito.seguirComprando')}
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to="/cuenta">{t('pedidos.verMisPedidos')}</Link>
        </Button>
      </div>
    </div>
  );
}
