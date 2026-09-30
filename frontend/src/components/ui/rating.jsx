import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

const TAMANOS = { sm: 'size-3.5', md: 'size-4', lg: 'size-5' };

/**
 * Calificación de 0 a 5 con estrellas parciales (4.5 → cuatro y media).
 * Para lectores de pantalla se anuncia como texto ("4.5 de 5 estrellas").
 */
export function Rating({ value, size = 'md', className }) {
  const { t, i18n } = useTranslation();
  const valor = Math.max(0, Math.min(5, Number(value) || 0));
  const etiqueta = t('producto.calificacion', {
    valor: formatNumber(valor, i18n.resolvedLanguage, { maximumFractionDigits: 1 }),
  });

  return (
    <span
      role="img"
      aria-label={etiqueta}
      className={cn('inline-flex items-center gap-0.5', className)}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const relleno = Math.max(0, Math.min(1, valor - i));
        return (
          <span key={i} className={cn('relative', TAMANOS[size])} aria-hidden="true">
            <Star
              className="absolute inset-0 size-full text-maiz/35"
              fill="currentColor"
              strokeWidth={0}
            />
            {relleno > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${relleno * 100}%` }}
              >
                <Star
                  className={cn('text-maiz', TAMANOS[size])}
                  fill="currentColor"
                  strokeWidth={0}
                />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
