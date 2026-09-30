import { cn } from '@/lib/utils';

export function Card({ className, interactive = false, ...props }) {
  return (
    <div
      data-slot="card"
      className={cn(
        'flex flex-col gap-5 rounded-xl border bg-card p-6 text-card-foreground shadow-soft',
        interactive &&
          'transition-[box-shadow,transform] duration-300 ease-andino hover:-translate-y-0.5 hover:shadow-lift',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <div data-slot="card-header" className={cn('grid gap-1.5', className)} {...props} />;
}

export function CardTitle({ className, as: Comp = 'h3', ...props }) {
  return <Comp data-slot="card-title" className={cn('text-h4 font-serif', className)} {...props} />;
}

export function CardDescription({ className, ...props }) {
  return (
    <p
      data-slot="card-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }) {
  return <div data-slot="card-content" className={cn(className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return (
    <div data-slot="card-footer" className={cn('flex items-center gap-3', className)} {...props} />
  );
}
