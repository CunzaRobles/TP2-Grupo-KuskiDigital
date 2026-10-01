import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

// Grupo de opciones en forma de tarjeta (dirección, método de envío, medio de pago).
// Radix RadioGroup: flechas para moverse, un solo tab stop y role="radio" en cada tarjeta.
export function RadioCardGroup({ className, ...props }) {
  return <RadioGroupPrimitive.Root className={cn('grid gap-3', className)} {...props} />;
}

export function RadioCard({ className, children, ...props }) {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        'group relative flex w-full items-start gap-4 rounded-surface border bg-card p-4 text-left shadow-surface',
        'transition-[border-color,box-shadow,background-color] duration-200 ease-andino',
        'hover:border-foreground/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        'data-[state=checked]:border-primary data-[state=checked]:bg-primary/4 data-[state=checked]:ring-1 data-[state=checked]:ring-primary',
        'disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:border-border',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-input transition-colors group-data-[state=checked]:border-primary"
      >
        <span className="size-2.5 scale-0 rounded-full bg-primary transition-transform duration-200 group-data-[state=checked]:scale-100" />
      </span>
      <span className="grid min-w-0 flex-1 gap-1">{children}</span>
    </RadioGroupPrimitive.Item>
  );
}
