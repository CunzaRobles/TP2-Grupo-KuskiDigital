import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

const VARIANTES = {
  error: { icono: CircleAlert, clase: 'border-destructive/30 bg-destructive/8 text-destructive' },
  aviso: { icono: TriangleAlert, clase: 'border-maiz/50 bg-maiz/12 text-terracota-700' },
  exito: { icono: CircleCheck, clase: 'border-verde/30 bg-verde/10 text-verde' },
  info: { icono: Info, clase: 'border-border bg-surface text-foreground' },
};

/**
 * Aviso en línea (errores de formulario, pago rechazado, stock…). Los errores usan
 * role="alert" para que el lector de pantalla los anuncie al aparecer.
 */
export function Alert({ variante = 'info', titulo, children, accion, className }) {
  const { icono: Icono, clase } = VARIANTES[variante];

  return (
    <div
      role={variante === 'error' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-xl border p-4 text-sm', clase, className)}
    >
      <Icono className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="grid flex-1 gap-1">
        {titulo && <p className="font-semibold">{titulo}</p>}
        {children && <div className="text-foreground/85">{children}</div>}
        {accion && <div className="pt-1">{accion}</div>}
      </div>
    </div>
  );
}
