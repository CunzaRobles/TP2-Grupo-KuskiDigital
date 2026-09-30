import { useId } from 'react';
import { cn } from '@/lib/utils';

// Chakana (cruz andina escalonada) con centro vacío.
const CHAKANA = 'M8 0h8v4h4v4h4v8h-4v4h-4v4H8v-4H4v-4H0V8h4V4h4zM12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6z';

// Rombo escalonado (motivo de awayo) con centro vacío, más un punto entre rombos.
const ROMBO = 'M5 2h2v2h2v2h2v2H9v2H7v2H5v-2H3V8H1V6h2V4h2zM5 6v2h2V6z';

/**
 * Divisor con motivo textil andino, siempre sutil (baja opacidad, color del token --pattern).
 * - variant="band": franja de rombos escalonados que se repite a lo ancho (bordes de sección).
 * - variant="ornament": línea que se desvanece con una chakana al centro (entre bloques de texto).
 */
export function AndeanDivider({ variant = 'band', className }) {
  const id = `andino-${useId().replace(/[^\w-]/g, '')}`;

  if (variant === 'ornament') {
    return (
      <div role="separator" className={cn('flex items-center gap-4 text-pattern', className)}>
        <span className="h-px flex-1 bg-linear-to-r from-transparent to-current opacity-40" />
        <svg viewBox="0 0 24 24" className="size-4 opacity-60" aria-hidden="true">
          <path d={CHAKANA} fill="currentColor" fillRule="evenodd" />
        </svg>
        <span className="h-px flex-1 bg-linear-to-l from-transparent to-current opacity-40" />
      </div>
    );
  }

  return (
    <div role="separator" className={cn('text-pattern', className)}>
      <svg className="block h-3.5 w-full opacity-35" aria-hidden="true" preserveAspectRatio="none">
        <defs>
          <pattern id={id} width="24" height="14" patternUnits="userSpaceOnUse">
            <path d="M0 .5h24M0 13.5h24" stroke="currentColor" strokeWidth="1" opacity="0.6" />
            <path d={ROMBO} fill="currentColor" fillRule="evenodd" />
            <rect x="17" y="6" width="2" height="2" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
    </div>
  );
}
