import { AnimatePresence, m as motion, useMotionValue, useTransform } from 'motion/react';
import { useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CurrencyContext } from '@/lib/currency';
import { formatMoney } from '@/lib/format';
import { transicion, useReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

const TAMANOS = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
  xl: 'font-heading text-h3',
};

/**
 * Conteo: el monto cuenta desde el valor anterior hasta el nuevo (p. ej. el subtotal del
 * carrito al cambiar una cantidad). Se escribe en el DOM sin re-renderizar. Con movimiento
 * reducido salta al valor final. Al cambiar de moneda o idioma se monta de nuevo (no cuenta
 * entre monedas distintas).
 */
function MontoConteo({ amount, moneda, idioma }) {
  const reducido = useReducedMotion();
  const valor = useMotionValue(Number(amount));
  const texto = useTransform(valor, (v) => formatMoney(v, moneda, idioma));

  useEffect(() => {
    const destino = Number(amount);
    if (reducido || !Number.isFinite(destino)) {
      valor.jump(destino);
      return undefined;
    }
    // El motor de animación de Motion llega con las funciones de LazyMotion (ya cargadas cuando
    // el carrito cambia); importarlo aquí en diferido lo deja fuera del bundle inicial.
    let controles;
    let cancelado = false;
    import('@/lib/motion/funciones').then(({ animar }) => {
      if (!cancelado) controles = animar(valor, destino, transicion('lenta'));
    });
    return () => {
      cancelado = true;
      controles?.stop();
    };
  }, [amount, reducido, valor]);

  // Los lectores de pantalla leen solo el valor final, no cada paso del conteo
  return (
    <>
      <motion.span aria-hidden="true">{texto}</motion.span>
      <span className="sr-only">{formatMoney(amount, moneda, idioma)}</span>
    </>
  );
}

/**
 * Monto formateado según la moneda activa (o `currency`) y el idioma.
 * El monto ya viene convertido por la API. Con `animate`, el cambio de valor se anima
 * (p. ej. al recalcular el envío al cambiar de país); con `animate="conteo"` el número cuenta
 * hasta el nuevo valor.
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
      {animate === 'conteo' ? (
        <MontoConteo key={`${moneda}-${idioma}`} amount={amount} moneda={moneda} idioma={idioma} />
      ) : animate ? (
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
