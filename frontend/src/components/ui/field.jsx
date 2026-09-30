import { Children, cloneElement, isValidElement, useId } from 'react';
import { Label } from 'radix-ui';
import { cn } from '@/lib/utils';

export function FieldLabel({ className, ...props }) {
  return (
    <Label.Root
      data-slot="label"
      className={cn('text-sm font-semibold text-foreground select-none', className)}
      {...props}
    />
  );
}

/**
 * Etiqueta + control + ayuda/error con ids y atributos ARIA conectados.
 * El único hijo (Input…) recibe id, aria-describedby y aria-invalid. Si el control no es el hijo
 * directo (Select → SelectTrigger), usa una función: {(props) => <Select><SelectTrigger {...props} />…}
 */
export function Field({ label, hint, error, className, children }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const controlProps = {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': [hintId, errorId].filter(Boolean).join(' ') || undefined,
  };
  const control = typeof children === 'function' ? children(controlProps) : Children.only(children);

  return (
    <div data-slot="field" className={cn('grid gap-1.5', className)}>
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      {typeof children === 'function'
        ? control
        : isValidElement(control) && cloneElement(control, controlProps)}
      {hint && !error && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
