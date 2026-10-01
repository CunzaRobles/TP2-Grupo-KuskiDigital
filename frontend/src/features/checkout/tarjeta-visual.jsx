import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { transicion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { detectarMarca, formatearNumero } from './tarjeta';

// Logotipos simplificados (no oficiales) para reconocer la marca de un vistazo.
function LogoMarca({ marca }) {
  if (marca === 'visa') {
    return (
      <span className="font-sans text-2xl font-bold tracking-tight italic" aria-label="Visa">
        VISA
      </span>
    );
  }
  if (marca === 'mastercard') {
    return (
      <span className="flex" role="img" aria-label="Mastercard">
        <span className="size-7 rounded-full bg-[#eb001b]" />
        <span className="-ml-3 size-7 rounded-full bg-[#f79e1b] mix-blend-screen" />
      </span>
    );
  }
  if (marca === 'amex') {
    return (
      <span
        className="rounded bg-white/90 px-1.5 text-xs font-bold text-[#1f72cd]"
        aria-label="American Express"
      >
        AMEX
      </span>
    );
  }
  return null;
}

/**
 * Vista previa de la tarjeta que se completa mientras se escribe. Es decorativa (aria-hidden):
 * el lector de pantalla ya tiene los campos del formulario.
 */
export function TarjetaVisual({ tarjeta }) {
  const { t } = useTranslation();
  const marca = detectarMarca(tarjeta.numero);
  const numero = formatearNumero(tarjeta.numero) || '•••• •••• •••• ••••';

  return (
    <div aria-hidden="true" className="mx-auto w-full max-w-sm [perspective:1000px]">
      <motion.div
        layout
        transition={transicion('lenta')}
        className={cn(
          'relative isolate flex aspect-[1.586] flex-col justify-between overflow-hidden rounded-2xl p-5 text-white shadow-lift',
          'bg-puna',
        )}
      >
        {/* Motivo textil sutil */}
        <svg className="absolute inset-0 -z-10 size-full opacity-10" preserveAspectRatio="none">
          <defs>
            <pattern id="tarjeta-rombos" width="28" height="28" patternUnits="userSpaceOnUse">
              <path
                d="M14 2 26 14 14 26 2 14z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#tarjeta-rombos)" />
        </svg>

        <div className="flex items-start justify-between">
          <span className="h-8 w-11 rounded-md bg-ichu" />
          <LogoMarca marca={marca} />
        </div>
        <p className="font-mono text-lg tracking-widest tabular-nums sm:text-xl">{numero}</p>
        <div className="flex items-end justify-between gap-4 text-xs">
          <div className="grid min-w-0 gap-0.5">
            <span className="text-white/60 uppercase">{t('checkout.pago.tarjeta.titular')}</span>
            <span className="truncate text-sm font-semibold uppercase">
              {tarjeta.titular || t('checkout.pago.tarjeta.titularEjemplo')}
            </span>
          </div>
          <div className="grid gap-0.5 text-right">
            <span className="text-white/60 uppercase">{t('checkout.pago.tarjeta.vence')}</span>
            <span className="text-sm font-semibold tabular-nums">
              {tarjeta.vencimiento || 'MM/AA'}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
