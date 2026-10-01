import { CircleCheck, CircleX, House, Package, Truck } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/format';
import { transicion } from '@/lib/motion';
import { cn } from '@/lib/utils';

const ICONOS = {
  confirmado: CircleCheck,
  preparando: Package,
  en_transito: Truck,
  entregado: House,
};

const VARIANTE_ESTADO = {
  pendiente: 'neutral',
  pagado: 'verde',
  preparando: 'maiz',
  en_transito: 'maiz',
  entregado: 'verde',
  cancelado: 'destructive',
};

export function EstadoPedido({ estado }) {
  const { t } = useTranslation();
  return (
    <Badge variant={VARIANTE_ESTADO[estado] ?? 'neutral'}>{t(`pedidos.estados.${estado}`)}</Badge>
  );
}

/**
 * Tracking visual: Confirmado → Preparando → En tránsito → Entregado, con la fecha de cada paso
 * alcanzado. Horizontal desde sm; vertical en móvil. `compacto` (lista de "Mis pedidos")
 * muestra solo iconos y nombres.
 */
export function Tracking({ tracking, compacto = false, className }) {
  const { t, i18n } = useTranslation();
  const { pasos, cancelado } = tracking;
  const ultimo = pasos.reduce((i, p, indice) => (p.completado ? indice : i), -1);
  const progreso = pasos.length > 1 ? Math.max(ultimo, 0) / (pasos.length - 1) : 0;

  if (cancelado) {
    return (
      <p className={cn('flex items-center gap-2 font-semibold text-destructive', className)}>
        <CircleX className="size-5" aria-hidden="true" />
        {t('pedidos.cancelado')}
      </p>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Línea de progreso detrás de los pasos (solo en horizontal) */}
      <div
        className={cn(
          'absolute right-[12.5%] left-[12.5%] hidden h-0.5 bg-border sm:block',
          compacto ? 'top-4' : 'top-5',
        )}
        aria-hidden="true"
      >
        <motion.div
          className="h-full origin-left bg-musgo"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progreso }}
          transition={{ ...transicion('lenta'), delay: 0.15 }}
        />
      </div>

      <ol className="relative grid gap-4 sm:grid-cols-4 sm:gap-2">
        {pasos.map((paso, i) => {
          const Icono = ICONOS[paso.clave] ?? CircleCheck;
          const actual = i === ultimo;
          return (
            <li
              key={paso.clave}
              className="flex items-center gap-3 sm:flex-col sm:gap-2 sm:text-center"
              aria-current={actual ? 'step' : undefined}
            >
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ ...transicion('base'), delay: i * 0.1 }}
                className={cn(
                  'relative flex shrink-0 items-center justify-center rounded-full border-2',
                  compacto ? 'size-8' : 'size-10',
                  paso.completado
                    ? 'border-musgo bg-musgo text-white'
                    : 'border-border bg-background text-muted-foreground',
                )}
              >
                {actual && !compacto && (
                  <span
                    className="absolute inset-0 animate-ping rounded-full bg-musgo/25"
                    aria-hidden="true"
                  />
                )}
                <Icono className={compacto ? 'size-4' : 'size-5'} aria-hidden="true" />
              </motion.span>
              <span className="grid">
                <span
                  className={cn(
                    'text-sm',
                    paso.completado ? 'font-semibold text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {t(`pedidos.tracking.${paso.clave}`)}
                  <span className="sr-only">
                    {' '}
                    (
                    {t(
                      paso.completado
                        ? 'pedidos.tracking.completado'
                        : 'pedidos.tracking.pendiente',
                    )}
                    )
                  </span>
                </span>
                {!compacto && paso.fecha && (
                  <time dateTime={paso.fecha} className="text-xs text-muted-foreground">
                    {formatDate(paso.fecha, i18n.resolvedLanguage, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </time>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
