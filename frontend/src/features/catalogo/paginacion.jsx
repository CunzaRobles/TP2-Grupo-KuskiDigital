import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';
import { aSearchParams } from './filtros';

// Páginas a mostrar: la primera, la última y las vecinas de la actual (1 … 4 5 6 … 12).
const paginasVisibles = (actual, total) => {
  const paginas = new Set([1, total, actual - 1, actual, actual + 1]);
  const ordenadas = [...paginas].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  return ordenadas.flatMap((p, i) => (i > 0 && p - ordenadas[i - 1] > 1 ? [`hueco-${p}`, p] : [p]));
};

const BASE =
  'inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-full px-3 text-sm font-semibold transition-colors duration-200 ease-andino';

function Flecha({ to, etiqueta, children }) {
  return to ? (
    <Link to={to} className={cn(BASE, 'hover:bg-secondary')} aria-label={etiqueta}>
      {children}
    </Link>
  ) : (
    <span className={cn(BASE, 'text-muted-foreground opacity-50')} aria-hidden="true">
      {children}
    </span>
  );
}

/**
 * Paginación con enlaces reales (?page=n): se pueden abrir en otra pestaña y el navegador
 * vuelve arriba al cambiar de página.
 */
export function Paginacion({ filtros, totalPages, className }) {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;

  const actual = Math.min(filtros.page, totalPages);
  const enlace = (page) => ({ search: `?${aSearchParams({ ...filtros, page })}` });

  return (
    <nav
      aria-label={t('catalogo.paginacion.label')}
      className={cn('flex justify-center', className)}
    >
      <ul className="flex flex-wrap items-center justify-center gap-1">
        <li>
          <Flecha
            to={actual > 1 ? enlace(actual - 1) : null}
            etiqueta={t('catalogo.paginacion.anterior')}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t('catalogo.paginacion.anterior')}</span>
          </Flecha>
        </li>
        {paginasVisibles(actual, totalPages).map((p) =>
          typeof p === 'string' ? (
            <li key={p} className="px-1 text-muted-foreground" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                to={enlace(p)}
                aria-current={p === actual ? 'page' : undefined}
                aria-label={t('catalogo.paginacion.pagina', { page: p })}
                className={cn(
                  BASE,
                  'tabular-nums',
                  p === actual
                    ? 'bg-primary text-primary-foreground shadow-soft'
                    : 'hover:bg-secondary',
                )}
              >
                {p}
              </Link>
            </li>
          ),
        )}
        <li>
          <Flecha
            to={actual < totalPages ? enlace(actual + 1) : null}
            etiqueta={t('catalogo.paginacion.siguiente')}
          >
            <span className="hidden sm:inline">{t('catalogo.paginacion.siguiente')}</span>
            <ChevronRight className="size-4" aria-hidden="true" />
          </Flecha>
        </li>
      </ul>
    </nav>
  );
}
