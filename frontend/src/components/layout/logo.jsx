import { cn } from '@/lib/utils';

// Isotipo: perfil de altitud que sube del valle a la cumbre, rematado por un punto de acento.
// Logotipo en la fuente display (Unbounded en la tienda; Fraunces dentro del admin).
// tone="light": sobre fondos oscuros (footer).
export function Logo({ className, compact = false, tone = 'dark' }) {
  const claro = tone === 'light';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2.5',
        claro ? 'text-niebla' : 'text-foreground',
        className,
      )}
    >
      <svg
        viewBox="0 0 32 32"
        className={cn(
          'shrink-0 transition-[width,height] duration-200 ease-andino',
          compact ? 'size-7' : 'size-8',
        )}
        fill="none"
        aria-hidden="true"
      >
        <path d="M3 28.5h26" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.5" />
        <path
          d="M3 24l6-1.5 4-7.5 5-1 4-4.5 3.5-2"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="26.5" cy="6.5" r="3" fill={claro ? 'var(--color-ichu)' : 'var(--primary)'} />
      </svg>
      <span className="font-display text-lg leading-none font-semibold tracking-tight whitespace-nowrap">
        Kuski
        <span
          className={cn(
            'font-sans font-medium tracking-normal',
            claro ? 'text-niebla/75' : 'text-muted-foreground',
          )}
        >
          {' '}
          Digital
        </span>
      </span>
    </span>
  );
}
