import { cn } from '@/lib/utils';

// Bloque de carga: color plano con un pulso de opacidad (lo compone la GPU, sin repintar cada
// frame). Con prefers-reduced-motion queda quieto (globals.css anula las animaciones CSS).
export function Skeleton({ className, ...props }) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn('animate-pulse rounded-item bg-muted', className)}
      {...props}
    />
  );
}
