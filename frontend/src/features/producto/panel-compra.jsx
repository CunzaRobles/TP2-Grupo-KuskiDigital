import {
  BadgeCheck,
  Check,
  MapPin,
  Mountain,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Price } from '@/components/ui/price';
import { QuantitySelector } from '@/components/ui/quantity-selector';
import { Rating } from '@/components/ui/rating';
import { toast } from '@/components/ui/toast';
import { useCarrito } from '@/features/carrito/carrito-context';
import { MAX_POR_PRODUCTO } from '@/features/carrito/carrito-storage';
import { RUTA_CHECKOUT } from '@/features/carrito/rutas';
import { useConfirmacion } from '@/features/carrito/use-confirmacion';
import { useNombres } from '@/features/catalogo/use-nombres';
import { formatNumber } from '@/lib/format';
import { Link } from '@/lib/motion/enlaces';
import { useNavigate } from '@/lib/motion/use-navigate';
import { cn } from '@/lib/utils';

// Umbral de "últimas unidades" cuando el producto no define su stock mínimo.
const POCAS_UNIDADES = 5;

function EstadoStock({ producto, enCarrito }) {
  const { t } = useTranslation();
  const umbral = Math.max(producto.stockMinimo ?? 0, POCAS_UNIDADES);

  let texto = t('producto.stock.disponible');
  let tono = 'bg-musgo';
  if (!producto.disponible) {
    texto = t('producto.agotado');
    tono = 'bg-niebla-borde';
  } else if (producto.stock <= umbral) {
    texto = t('producto.stock.pocas', { count: producto.stock });
    tono = 'bg-error';
  }

  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold">
      <span className="inline-flex items-center gap-2">
        <span className={cn('size-2 rounded-full', tono)} aria-hidden="true" />
        {texto}
      </span>
      {enCarrito > 0 && (
        <span className="font-normal text-muted-foreground">
          {t('producto.stock.enCarrito', { count: enCarrito })}
        </span>
      )}
    </p>
  );
}

/**
 * Panel de compra: categoría, nombre, calificación, precio en la moneda elegida,
 * certificaciones, origen, stock, cantidad, "Agregar al carrito" (abre el drawer) y
 * "Comprar ahora" (va directo al checkout).
 */
export function PanelCompra({ producto, onVerTab, className }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const nombres = useNombres();
  const { agregar, abrir, cantidadEn } = useCarrito();
  const [cantidad, setCantidad] = useState(1);
  const [agregado, confirmar] = useConfirmacion();

  const { categoria, comunidad, resenas } = producto;
  const enCarrito = cantidadEn(producto.id);
  const restante = Math.max(0, Math.min(producto.stock, MAX_POR_PRODUCTO) - enCarrito);
  const puedeAgregar = producto.disponible && restante > 0;
  const cantidadValida = Math.min(cantidad, Math.max(restante, 1));

  const alAgregar = () => {
    const agregado = agregar(producto, cantidadValida);
    if (agregado > 0) {
      setCantidad(1);
      confirmar();
      abrir();
    } else {
      toast.info(t('carrito.sinMasStock'), { description: producto.nombre });
    }
  };

  const alComprar = () => {
    if (puedeAgregar) agregar(producto, cantidadValida);
    navigate(RUTA_CHECKOUT);
  };

  return (
    <div className={cn('grid gap-6', className)}>
      <div className="grid gap-3">
        {categoria && (
          <Link
            to={`/catalogo?categoria=${categoria.slug}`}
            className="eyebrow w-fit text-link hover:underline"
          >
            {nombres.categoria(categoria)}
          </Link>
        )}
        <h1 className="text-h2">{producto.nombre}</h1>
        {resenas.total > 0 ? (
          <button
            type="button"
            onClick={() => onVerTab('resenas')}
            className="flex w-fit items-center gap-2 rounded-sm text-sm hover:underline"
          >
            <Rating value={resenas.promedio} />
            <span className="font-semibold tabular-nums">
              {formatNumber(resenas.promedio, i18n.resolvedLanguage, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
            </span>
            <span className="text-muted-foreground">
              ({t('producto.resenas.total', { count: resenas.total })})
            </span>
          </button>
        ) : (
          <p className="text-sm text-muted-foreground">{t('producto.resenas.sinResenas')}</p>
        )}
      </div>

      <Price
        amount={producto.precio.monto}
        currency={producto.precio.moneda}
        size="xl"
        animate
        className="text-foreground"
      />

      {producto.certificaciones.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label={t('producto.ficha.certificaciones')}>
          {producto.certificaciones.map((c) => (
            <li key={c.id}>
              <Badge variant="verde" title={c.entidadEmisora ?? undefined}>
                <BadgeCheck aria-hidden="true" />
                {nombres.certificacion(c)}
              </Badge>
            </li>
          ))}
        </ul>
      )}

      {comunidad && (
        <button
          type="button"
          onClick={() => onVerTab('origen')}
          className="grid w-fit gap-1.5 rounded-lg text-left text-sm hover:text-link"
        >
          <span className="flex items-center gap-2 font-semibold">
            <MapPin className="size-4 shrink-0 text-musgo" aria-hidden="true" />
            {comunidad.nombre}
          </span>
          {comunidad.altitudMsnm != null && (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Mountain className="size-4 shrink-0 text-musgo" aria-hidden="true" />
              {t('producto.altitud', {
                valor: formatNumber(comunidad.altitudMsnm, i18n.resolvedLanguage),
              })}
              {' · '}
              {[comunidad.provincia, comunidad.region].filter(Boolean).join(', ')}
            </span>
          )}
        </button>
      )}

      <div className="grid gap-4 rounded-2xl border bg-card p-5 shadow-soft">
        <EstadoStock producto={producto} enCarrito={enCarrito} />
        <div className="flex flex-wrap items-center gap-3">
          <QuantitySelector
            value={cantidadValida}
            onChange={setCantidad}
            max={Math.max(restante, 1)}
            disabled={!puedeAgregar}
          />
          <Button
            size="lg"
            className={cn('flex-1', agregado && 'bg-musgo hover:bg-musgo')}
            onClick={alAgregar}
            disabled={!puedeAgregar && !agregado}
          >
            {agregado ? <Check aria-hidden="true" /> : <ShoppingBag aria-hidden="true" />}
            {agregado ? t('carrito.agregadoCorto') : t('producto.agregar')}
          </Button>
        </div>
        <Button
          variant="secondary"
          size="lg"
          onClick={alComprar}
          disabled={!producto.disponible && enCarrito === 0}
        >
          <Zap aria-hidden="true" />
          {t('producto.comprarAhora')}
        </Button>
      </div>

      <ul className="grid gap-3 text-sm text-muted-foreground">
        <li className="flex gap-3">
          <Truck className="mt-0.5 size-4 shrink-0 text-musgo" aria-hidden="true" />
          {t('producto.envio')}
        </li>
        <li className="flex gap-3">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-musgo" aria-hidden="true" />
          {t('producto.sinCostosOcultos')}
        </li>
      </ul>
    </div>
  );
}
