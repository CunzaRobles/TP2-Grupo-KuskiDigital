import { useId } from 'react';
import { cn } from '@/lib/utils';

// Motivo de la tienda: marcas de una regla de altitud (una larga cada cinco), en currentColor.
// Decorativo: va en bordes y divisores, nunca como fondo.
export function MarcasRegla({ className }) {
  const id = useId();

  return (
    <svg aria-hidden="true" className={cn('block h-3 w-full', className)}>
      <defs>
        <pattern id={id} width="40" height="12" patternUnits="userSpaceOnUse">
          <path
            d="M0.5 0v12M8.5 0v5M16.5 0v5M24.5 0v5M32.5 0v5"
            stroke="currentColor"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
