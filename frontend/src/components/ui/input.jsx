import { cn } from '@/lib/utils';

// Campo de texto. aria-invalid="true" lo pinta como error (lo hace <Field> automáticamente).
export function Input({ className, type = 'text', ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-11 w-full min-w-0 rounded-field border border-input bg-card px-3.5 text-base text-foreground shadow-field',
        'transition-[border-color,box-shadow] duration-200 ease-andino placeholder:text-muted-foreground',
        'focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-semibold',
        className,
      )}
      {...props}
    />
  );
}
