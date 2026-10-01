import { X } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/lib/currency';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useCategorias, useCertificaciones, useComunidades } from './api';
import { FILTROS_VACIOS, alternar } from './filtros';
import { useNombres } from './use-nombres';

function Grupo({ titulo, children, className }) {
  return (
    <fieldset className={cn('grid gap-3 border-t pt-5 first:border-t-0 first:pt-0', className)}>
      <legend className="float-left mb-3 w-full text-sm font-semibold">{titulo}</legend>
      {children}
    </fieldset>
  );
}

function Opcion({ checked, onChange, children, extra }) {
  const id = useId();
  return (
    <div className="flex items-center gap-3">
      <Checkbox id={id} checked={checked} onCheckedChange={onChange} />
      <FieldLabel
        htmlFor={id}
        className="flex flex-1 cursor-pointer items-baseline justify-between gap-2 font-medium"
      >
        <span>{children}</span>
        {extra != null && (
          <span className="text-xs font-normal text-muted-foreground tabular-nums">{extra}</span>
        )}
      </FieldLabel>
    </div>
  );
}

function ListaSkeleton() {
  return (
    <div className="grid gap-3" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-5 w-4/5" />
      ))}
    </div>
  );
}

// Rango de precio en la moneda elegida. El estado local es un borrador: se aplica al enviar.
// El padre lo monta con `key` = valores de la URL, así se reinicia si cambian desde fuera.
function FiltroPrecio({ precioMin, precioMax, onAplicar }) {
  const { t } = useTranslation();
  const { moneda } = useCurrency();
  const [min, setMin] = useState(precioMin ?? '');
  const [max, setMax] = useState(precioMax ?? '');
  const idMin = useId();
  const idMax = useId();

  const aNumero = (texto) => {
    const n = Number(String(texto).replace(',', '.'));
    return String(texto).trim() === '' || !Number.isFinite(n) || n < 0 ? undefined : n;
  };

  const aplicar = (evento) => {
    evento.preventDefault();
    let nuevoMin = aNumero(min);
    let nuevoMax = aNumero(max);
    if (nuevoMin !== undefined && nuevoMax !== undefined && nuevoMin > nuevoMax) {
      [nuevoMin, nuevoMax] = [nuevoMax, nuevoMin];
    }
    onAplicar({ precioMin: nuevoMin, precioMax: nuevoMax });
  };

  return (
    <form onSubmit={aplicar} className="grid gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <FieldLabel htmlFor={idMin} className="text-xs text-muted-foreground">
            {t('catalogo.filtro.minimo')}
          </FieldLabel>
          <Input
            id={idMin}
            inputMode="decimal"
            placeholder="0"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            className="h-10"
          />
        </div>
        <div className="grid gap-1.5">
          <FieldLabel htmlFor={idMax} className="text-xs text-muted-foreground">
            {t('catalogo.filtro.maximo')}
          </FieldLabel>
          <Input
            id={idMax}
            inputMode="decimal"
            placeholder="—"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            className="h-10"
          />
        </div>
      </div>
      <Button type="submit" variant="secondary" size="sm">
        {t('catalogo.filtro.aplicarPrecio', { moneda })}
      </Button>
    </form>
  );
}

/**
 * Filtros del catálogo (categoría, precio, comunidad, certificación). Se usa en la barra
 * lateral de escritorio y en el drawer de móvil; cada cambio se refleja en la URL al instante.
 */
export function FiltrosPanel({ filtros, onCambiar, className }) {
  const { t } = useTranslation();
  const { moneda } = useCurrency();
  const nombres = useNombres();
  const categorias = useCategorias();
  const comunidades = useComunidades();
  const certificaciones = useCertificaciones();

  return (
    <div className={cn('grid gap-5', className)}>
      <Grupo titulo={t('catalogo.filtro.categoria')}>
        {categorias.isPending ? (
          <ListaSkeleton />
        ) : (
          categorias.data?.map((c) => (
            <Opcion
              key={c.id}
              checked={filtros.categorias.includes(c.slug)}
              onChange={() => onCambiar({ categorias: alternar(filtros.categorias, c.slug) })}
              extra={c.totalProductos}
            >
              {nombres.categoria(c)}
            </Opcion>
          ))
        )}
      </Grupo>

      <Grupo titulo={t('catalogo.filtro.precio', { moneda })}>
        <FiltroPrecio
          key={`${filtros.precioMin}-${filtros.precioMax}-${moneda}`}
          precioMin={filtros.precioMin}
          precioMax={filtros.precioMax}
          onAplicar={onCambiar}
        />
      </Grupo>

      <Grupo titulo={t('catalogo.filtro.comunidad')}>
        {comunidades.isPending ? (
          <ListaSkeleton />
        ) : (
          comunidades.data
            ?.filter((c) => c.totalProductos > 0 || filtros.comunidades.includes(c.id))
            .map((c) => (
              <Opcion
                key={c.id}
                checked={filtros.comunidades.includes(c.id)}
                onChange={() => onCambiar({ comunidades: alternar(filtros.comunidades, c.id) })}
                extra={c.totalProductos}
              >
                {c.nombre}
              </Opcion>
            ))
        )}
      </Grupo>

      <Grupo titulo={t('catalogo.filtro.certificacion')}>
        {certificaciones.isPending ? (
          <ListaSkeleton />
        ) : (
          certificaciones.data?.map((c) => (
            <Opcion
              key={c.id}
              checked={filtros.certificaciones.includes(c.id)}
              onChange={() =>
                onCambiar({ certificaciones: alternar(filtros.certificaciones, c.id) })
              }
            >
              {nombres.certificacion(c)}
            </Opcion>
          ))
        )}
      </Grupo>
    </div>
  );
}

/** Chips de los filtros activos, cada uno con su botón para quitarlo, más "Limpiar filtros". */
export function FiltrosActivos({ filtros, onCambiar, className }) {
  const { t, i18n } = useTranslation();
  const { moneda } = useCurrency();
  const nombres = useNombres();
  const { data: categorias = [] } = useCategorias();
  const { data: comunidades = [] } = useComunidades();
  const { data: certificaciones = [] } = useCertificaciones();
  const dinero = (monto) => formatMoney(monto, moneda, i18n.resolvedLanguage);

  const chips = [
    ...filtros.categorias.map((slug) => {
      const c = categorias.find((x) => x.slug === slug);
      return {
        clave: `cat-${slug}`,
        etiqueta: c ? nombres.categoria(c) : slug,
        quitar: { categorias: filtros.categorias.filter((s) => s !== slug) },
      };
    }),
    ...(filtros.precioMin !== undefined || filtros.precioMax !== undefined
      ? [
          {
            clave: 'precio',
            etiqueta:
              filtros.precioMin !== undefined && filtros.precioMax !== undefined
                ? `${dinero(filtros.precioMin)} – ${dinero(filtros.precioMax)}`
                : filtros.precioMin !== undefined
                  ? t('catalogo.filtro.desde', { monto: dinero(filtros.precioMin) })
                  : t('catalogo.filtro.hasta', { monto: dinero(filtros.precioMax) }),
            quitar: { precioMin: undefined, precioMax: undefined },
          },
        ]
      : []),
    ...filtros.comunidades.map((id) => ({
      clave: `com-${id}`,
      etiqueta: comunidades.find((c) => c.id === id)?.nombre ?? `#${id}`,
      quitar: { comunidades: filtros.comunidades.filter((x) => x !== id) },
    })),
    ...filtros.certificaciones.map((id) => {
      const c = certificaciones.find((x) => x.id === id);
      return {
        clave: `cert-${id}`,
        etiqueta: c ? nombres.certificacion(c) : `#${id}`,
        quitar: { certificaciones: filtros.certificaciones.filter((x) => x !== id) },
      };
    }),
    ...(filtros.q ? [{ clave: 'q', etiqueta: `“${filtros.q}”`, quitar: { q: undefined } }] : []),
  ];

  if (!chips.length) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="sr-only">{t('catalogo.filtrosActivos')}</span>
      <ul className="contents">
        {chips.map((chip) => (
          <li key={chip.clave}>
            <button
              type="button"
              onClick={() => onCambiar(chip.quitar)}
              aria-label={t('catalogo.quitarFiltro', { nombre: chip.etiqueta })}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-secondary pr-2.5 pl-3.5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary-hover"
            >
              {chip.etiqueta}
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <Button
        variant="link"
        size="sm"
        className="h-8 px-2"
        onClick={() => onCambiar(FILTROS_VACIOS)}
      >
        {t('catalogo.limpiar')}
      </Button>
    </div>
  );
}
