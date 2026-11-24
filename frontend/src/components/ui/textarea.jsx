import { cn } from '@/lib/utils';

// Texto de varias líneas, con el mismo aspecto que <Input>. aria-invalid="true" lo pinta como
// error (lo hace <Field> automáticamente).
export function Textarea({ className, rows = 4, ...props }) {
  return (
    <textarea
      data-slot="textarea"
      rows={rows}
      className={cn(
        'w-full min-w-0 rounded-field border border-input bg-card px-3.5 py-2.5 text-base text-foreground shadow-field',
        'transition-[border-color,box-shadow] duration-200 ease-andino placeholder:text-muted-foreground',
        'focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
