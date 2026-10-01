import { AnimatePresence, motion } from 'motion/react';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { CurrencyContext } from '@/lib/currency';
import { formatMoney } from '@/lib/format';
import { transicion } from '@/lib/motion';
import { cn } from '@/lib/utils';

const TAMANOS = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
  xl: 'font-heading text-h3',
};

/**
 * Monto formateado según la moneda activa (o `currency`) y el idioma.
 * El monto ya viene convertido por la API. Con `animate`, el cambio de valor se anima
 * (p. ej. al recalcular el envío al cambiar de país).
 */
export function Price({
  amount,
  currency,
  compareAt,
  size = 'md',
  animate = false,
  className,
  ...props
}) {
  const { i18n } = useTranslation();
  const monedaActiva = useContext(CurrencyContext)?.moneda ?? 'PEN';
  const moneda = currency ?? monedaActiva;
  const idioma = i18n.resolvedLanguage ?? 'es';
  const texto = formatMoney(amount, moneda, idioma);

  return (
    <span
      data-slot="price"
      data-currency={moneda}
      className={cn(
        'inline-flex items-baseline gap-2 font-semibold tabular-nums',
        TAMANOS[size],
        className,
      )}
      {...props}
    >
      {animate ? (
        <span className="relative inline-flex overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={texto}
              initial={{ y: '60%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '-60%', opacity: 0 }}
              transition={transicion('base')}
            >
              {texto}
            </motion.span>
          </AnimatePresence>
        </span>
      ) : (
        texto
      )}
      {compareAt != null && Number(compareAt) > Number(amount) && (
        <s className="text-[0.8em] font-normal text-muted-foreground">
          {formatMoney(compareAt, moneda, idioma)}
        </s>
      )}
    </span>
  );
}
