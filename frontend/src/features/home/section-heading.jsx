import { RotateCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Encabezado de sección: título (Unbounded), descripción y acción opcional a la derecha.
// La tienda nueva no usa antetítulo; `eyebrow` queda solo para páginas aún no rediseñadas.
export function SectionHeading({ id, eyebrow, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-12',
        className,
      )}
    >
      <div className="grid max-w-2xl gap-4">
        {eyebrow && <p className="eyebrow text-link">{eyebrow}</p>}
        <h2 id={id} className="text-h2">
          {title}
        </h2>
        {description && <p className="text-lead text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// Estado de error de un bloque del home: no rompe la página, ofrece reintentar.
export function SectionError({ onRetry, className }) {
  const { t } = useTranslation();

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center gap-4 border border-dashed px-6 py-12 text-center',
        className,
      )}
    >
      <p className="text-muted-foreground">{t('estado.error')}</p>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        <RotateCw aria-hidden="true" />
        {t('estado.reintentar')}
      </Button>
    </div>
  );
}
