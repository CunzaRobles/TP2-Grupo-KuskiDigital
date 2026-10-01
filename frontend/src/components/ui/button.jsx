import { cva } from 'class-variance-authority';
import { LoaderCircle } from 'lucide-react';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'relative inline-flex shrink-0 items-center justify-center gap-2 rounded-button font-sans font-semibold whitespace-nowrap select-none',
    'transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-andino',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
    'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-wait',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground shadow-field hover:bg-primary-hover',
        secondary:
          'border border-input bg-card text-foreground hover:border-foreground hover:bg-secondary',
        ghost: 'text-foreground hover:bg-secondary',
        destructive: 'bg-destructive text-destructive-foreground hover:opacity-90',
        link: 'rounded-none text-link underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-6 text-sm',
        lg: 'h-13 px-8 text-base',
        icon: 'size-11 rounded-full',
        'icon-sm': 'size-9 rounded-full',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

/**
 * Botón de la marca. `asChild` permite estilizar un <Link> sin anidar elementos interactivos.
 * `loading` bloquea el botón y muestra un indicador (para pagos simulados, envíos de formularios…).
 */
export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  type,
  ...props
}) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={asChild ? undefined : disabled || loading}
      aria-busy={loading || undefined}
      type={asChild ? undefined : (type ?? 'button')}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <LoaderCircle className="animate-spin" aria-hidden="true" />}
          {children}
        </>
      )}
    </Comp>
  );
}
