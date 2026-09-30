import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Piezas de interfaz compartidas por las páginas del panel admin.

export function PageHeader({ eyebrow, titulo, descripcion, acciones }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="grid gap-1.5">
        {eyebrow && <p className="eyebrow text-link">{eyebrow}</p>}
        <h1 className="text-h2">{titulo}</h1>
        {descripcion && <p className="max-w-2xl text-muted-foreground">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </header>
  );
}

/**
 * Tabla con scroll horizontal en móvil (nunca desborda la página). `caption` se lee en lectores
 * de pantalla. `cargando` muestra filas esqueleto.
 */
export function Tabla({
  caption,
  columnas,
  cargando = false,
  filasCarga = 6,
  children,
  className,
}) {
  return (
    <div className={cn('overflow-x-auto rounded-xl border bg-card shadow-soft', className)}>
      <table className="w-full min-w-[40rem] border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b bg-surface text-left">
            {columnas.map((c) => (
              <th
                key={c.clave}
                scope="col"
                className={cn(
                  'px-4 py-3 text-xs font-bold tracking-wide whitespace-nowrap text-muted-foreground uppercase',
                  c.alinear === 'derecha' && 'text-right',
                  c.className,
                )}
              >
                {c.etiqueta}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {cargando
            ? Array.from({ length: filasCarga }, (_, i) => (
                <tr key={i}>
                  {columnas.map((c) => (
                    <td key={c.clave} className="px-4 py-3.5">
                      <Skeleton className="h-4 w-full max-w-32" />
                    </td>
                  ))}
                </tr>
              ))
            : children}
        </tbody>
      </table>
    </div>
  );
}

export function Td({ className, alinear, ...props }) {
  return (
    <td
      className={cn(
        'px-4 py-3 align-middle',
        alinear === 'derecha' && 'text-right tabular-nums',
        className,
      )}
      {...props}
    />
  );
}

// Fila vacía de una tabla (sin resultados para el filtro).
export function FilaVacia({ columnas, children }) {
  return (
    <tr>
      <td colSpan={columnas} className="px-4 py-12 text-center text-muted-foreground">
        {children}
      </td>
    </tr>
  );
}

export function PaginacionAdmin({ pagination, onPage, className }) {
  const { t } = useTranslation();
  if (!pagination || pagination.total === 0) return null;
  const { page, limit, total, totalPages } = pagination;
  const desde = (page - 1) * limit + 1;
  const hasta = Math.min(page * limit, total);

  return (
    <nav
      aria-label={t('admin.tabla.paginacion')}
      className={cn('flex flex-wrap items-center justify-between gap-3 text-sm', className)}
    >
      <p className="text-muted-foreground tabular-nums">
        {t('admin.tabla.rango', { desde, hasta, total })}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label={t('catalogo.paginacion.anterior')}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <span className="px-2 tabular-nums">
          {t('admin.tabla.pagina', { page, totalPages: Math.max(totalPages, 1) })}
        </span>
        <Button
          variant="ghost"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          aria-label={t('catalogo.paginacion.siguiente')}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}

// Tarjeta de sección dentro de una página (gráficos, listas).
export function Panel({ titulo, descripcion, acciones, className, children }) {
  return (
    <section
      className={cn('grid gap-4 rounded-xl border bg-card p-5 shadow-soft sm:p-6', className)}
    >
      {(titulo || acciones) && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1">
            {titulo && <h2 className="text-h4">{titulo}</h2>}
            {descripcion && <p className="text-sm text-muted-foreground">{descripcion}</p>}
          </div>
          {acciones}
        </div>
      )}
      {children}
    </section>
  );
}
