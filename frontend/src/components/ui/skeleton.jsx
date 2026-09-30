import { cn } from '@/lib/utils';

// Bloque de carga con brillo suave (se detiene con prefers-reduced-motion).
export function Skeleton({ className, ...props }) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        'animate-shimmer rounded-md bg-[linear-gradient(90deg,var(--muted)_0%,var(--secondary-hover)_50%,var(--muted)_100%)] bg-size-[200%_100%]',
        className,
      )}
      {...props}
    />
  );
}
