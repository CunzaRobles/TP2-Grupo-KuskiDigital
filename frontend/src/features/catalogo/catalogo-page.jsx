import { Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { AndeanDivider } from '@/components/ui/andean-divider';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SectionError } from '@/features/home/section-heading';
import { useCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { useCategorias, useComunidades, useProductos } from './api';
import {
  FILTROS_VACIOS,
  ORDENES,
  POR_PAGINA,
  aSearchParams,
  cambiarFiltros,
  contarFiltros,
  leerFiltros,
} from './filtros';
import { FiltrosActivos, FiltrosPanel } from './filtros-panel';
import { Paginacion } from './paginacion';
import { ProductCard, ProductCardSkeleton } from './product-card';
import { useNombres } from './use-nombres';

// Búsqueda por texto: se aplica al enviar (Enter o botón), no en cada tecla.
function Buscador({ q, onBuscar }) {
  const { t } = useTranslation();
  const [texto, setTexto] = useState(q ?? '');

  return (
    <form
      role="search"
      className="relative flex-1 sm:max-w-sm"
      onSubmit={(e) => {
        e.preventDefault();
        onBuscar(texto.trim() || undefined);
      }}
    >
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={t('catalogo.buscarPlaceholder')}
        aria-label={t('catalogo.buscar')}
        maxLength={100}
        className="pl-10"
      />
    </form>
  );
}

// Encabezado: si hay una sola categoría (o comunidad) filtrada, la página toma su nombre.
function Encabezado({ filtros }) {
  const { t } = useTranslation();
  const nombres = useNombres();
  const { data: categorias } = useCategorias();
  const { data: comunidades } = useComunidades();

  const soloCategoria =
    filtros.categorias.length === 1 && filtros.comunidades.length === 0
      ? categorias?.find((c) => c.slug === filtros.categorias[0])
      : null;
  const soloComunidad =
    filtros.comunidades.length === 1 && filtros.categorias.length === 0
      ? comunidades?.find((c) => c.id === filtros.comunidades[0])
      : null;

  let titulo = t('catalogo.titulo');
  let descripcion = t('catalogo.descripcion');
  if (soloCategoria) {
    titulo = nombres.categoria(soloCategoria);
    descripcion = t(`catalogo.categorias.${soloCategoria.slug}.descripcion`, {
      defaultValue: soloCategoria.descripcion ?? descripcion,
    });
  } else if (soloComunidad) {
    titulo = soloComunidad.nombre;
    descripcion = t('catalogo.descripcionComunidad', {
      provincia: soloComunidad.provincia,
      region: soloComunidad.region,
    });
  }

  return (
    <header className="grid max-w-3xl gap-4">
      <title>{`${titulo} · Kuski`}</title>
      <p className="eyebrow text-link">{t('catalogo.eyebrow')}</p>
      <h1 className="text-h1">{titulo}</h1>
      <p className="text-lead text-muted-foreground">{descripcion}</p>
    </header>
  );
}

export function CatalogoPage() {
  const { t } = useTranslation();
  const { moneda } = useCurrency();
  const [searchParams, setSearchParams] = useSearchParams();
  const filtros = useMemo(() => leerFiltros(searchParams), [searchParams]);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const { data, isPending, isError, isPlaceholderData, refetch } = useProductos(filtros);
  const items = data?.items ?? [];
  const total = data?.pagination.total ?? 0;

  // Los filtros se guardan en la URL sin volver arriba (el usuario sigue donde estaba).
  const cambiar = (cambios) =>
    setSearchParams(aSearchParams(cambiarFiltros(filtros, cambios)), {
      preventScrollReset: true,
    });

  // El rango de precio está expresado en la moneda elegida: si cambia la moneda, deja de
  // tener sentido y se quita (en lugar de reinterpretarlo en otra moneda).
  const monedaAnterior = useRef(moneda);
  const quitarPrecioPorMoneda = useEffectEvent(() => {
    if (filtros.precioMin === undefined && filtros.precioMax === undefined) return;
    setSearchParams(
      aSearchParams(cambiarFiltros(filtros, { precioMin: undefined, precioMax: undefined })),
      { replace: true, preventScrollReset: true },
    );
  });
  useEffect(() => {
    if (monedaAnterior.current === moneda) return;
    monedaAnterior.current = moneda;
    quitarPrecioPorMoneda();
  }, [moneda]);

  const activos = contarFiltros(filtros);
  const desde = total === 0 ? 0 : (filtros.page - 1) * POR_PAGINA + 1;
  const hasta = Math.min(filtros.page * POR_PAGINA, total);

  return (
    <div className="container-page grid gap-8 py-10 sm:py-14">
      <Encabezado filtros={filtros} />
      <AndeanDivider />

      <div className="grid gap-10 lg:grid-cols-[15rem_1fr] xl:gap-14">
        {/* Escritorio: filtros en barra lateral fija */}
        <aside aria-label={t('catalogo.filtros')} className="hidden lg:block">
          <div className="sticky top-[calc(var(--spacing-header-compact)+1.5rem)] max-h-[calc(100dvh-var(--spacing-header-compact)-3rem)] overflow-y-auto pr-2 pb-4">
            <FiltrosPanel filtros={filtros} onCambiar={cambiar} />
          </div>
        </aside>

        <section aria-labelledby="catalogo-resultados" className="grid content-start gap-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Buscador key={filtros.q ?? ''} q={filtros.q} onBuscar={(q) => cambiar({ q })} />
            <div className="flex items-center gap-3 sm:ml-auto">
              {/* Móvil: filtros en un drawer */}
              <Button
                variant="secondary"
                className="flex-1 lg:hidden"
                onClick={() => setFiltrosAbiertos(true)}
                aria-haspopup="dialog"
              >
                <SlidersHorizontal aria-hidden="true" />
                {t('catalogo.filtros')}
                {activos > 0 && (
                  <span className="rounded-full bg-primary px-2 text-xs leading-5 text-primary-foreground tabular-nums">
                    {activos}
                  </span>
                )}
              </Button>
              <Select value={filtros.orden} onValueChange={(orden) => cambiar({ orden })}>
                <SelectTrigger aria-label={t('catalogo.orden.label')} className="flex-1 sm:w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {ORDENES.map((orden) => (
                    <SelectItem key={orden} value={orden}>
                      {t(`catalogo.orden.${orden}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2
              id="catalogo-resultados"
              className="text-sm font-semibold text-muted-foreground"
              aria-live="polite"
            >
              {isPending
                ? t('ui.cargando')
                : total > 0
                  ? t('catalogo.mostrando', { desde, hasta, total })
                  : t('catalogo.resultados', { count: 0 })}
            </h2>
          </div>
          <FiltrosActivos filtros={filtros} onCambiar={cambiar} className="-mt-2" />

          {isError ? (
            <SectionError onRetry={refetch} />
          ) : !isPending && items.length === 0 ? (
            <EmptyState
              objeto="busqueda"
              titulo={t('catalogo.vacio.titulo')}
              descripcion={t('catalogo.vacio.descripcion')}
              accion={
                activos > 0 ? (
                  <Button onClick={() => cambiar(FILTROS_VACIOS)}>{t('catalogo.limpiar')}</Button>
                ) : null
              }
            />
          ) : (
            <ul
              className={cn(
                'grid grid-cols-2 gap-x-4 gap-y-10 transition-opacity duration-300 sm:gap-x-6 xl:grid-cols-3',
                isPlaceholderData && 'opacity-60',
              )}
              aria-busy={isPending || isPlaceholderData || undefined}
            >
              {isPending
                ? Array.from({ length: 6 }, (_, i) => (
                    <li key={`skeleton-${i}`}>
                      <ProductCardSkeleton />
                    </li>
                  ))
                : items.map((producto) => (
                    <li key={producto.id}>
                      <ProductCard producto={producto} />
                    </li>
                  ))}
            </ul>
          )}

          <Paginacion
            filtros={filtros}
            totalPages={data?.pagination.totalPages ?? 0}
            className="pt-6"
          />
        </section>
      </div>

      <Drawer open={filtrosAbiertos} onOpenChange={setFiltrosAbiertos}>
        <DrawerContent side="left" className="text-foreground">
          <DrawerHeader>
            <DrawerTitle>{t('catalogo.filtros')}</DrawerTitle>
            <DrawerDescription>{t('catalogo.filtrosDescripcion')}</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            <FiltrosPanel filtros={filtros} onCambiar={cambiar} />
          </DrawerBody>
          <DrawerFooter className="grid-cols-[auto_1fr]">
            <Button
              variant="secondary"
              onClick={() => cambiar(FILTROS_VACIOS)}
              disabled={activos === 0}
            >
              {t('catalogo.limpiar')}
            </Button>
            <Button onClick={() => setFiltrosAbiertos(false)} loading={isPlaceholderData}>
              {t('catalogo.verResultados', { count: total })}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
