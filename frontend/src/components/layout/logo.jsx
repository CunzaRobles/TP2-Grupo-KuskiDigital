import { cn } from '@/lib/utils';

// Isotipo: rombo escalonado (achiote + maíz) y logotipo en Fraunces.
// tone="light": sobre fondos oscuros (hero, footer).
export function Logo({ className, compact = false, tone = 'dark' }) {
  const claro = tone === 'light';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2.5 transition-colors duration-300',
        claro ? 'text-alpaca' : 'text-foreground',
        className,
      )}
    >
      <svg
        viewBox="0 0 32 32"
        className={cn(
          'shrink-0 transition-[width,height] duration-300 ease-andino',
          compact ? 'size-7' : 'size-8',
        )}
        aria-hidden="true"
      >
        <path fill="var(--color-terracota)" d="M16 3l13 13-13 13L3 16z" />
        <path fill="var(--color-maiz)" d="M16 10l6 6-6 6-6-6z" />
        <path fill="var(--background)" d="M16 14l2 2-2 2-2-2z" />
      </svg>
      <span className="font-serif text-xl leading-none font-semibold tracking-tight">
        Kuski
        <span className={cn('font-normal', claro ? 'text-alpaca/70' : 'text-muted-foreground')}>
          {' '}
          Digital
        </span>
      </span>
    </span>
  );
}
