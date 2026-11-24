import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionError } from '@/features/home/section-heading';
import { formatDate, IDIOMAS } from '@/lib/format';
import { Link } from '@/lib/motion/enlaces';
import { useMediaQuery } from '@/lib/use-media-query';
import { cn } from '@/lib/utils';
import { DOCUMENTOS } from './empresa';
import { TextoLegal } from './texto-legal';

// Mismo corte que `lg` de Tailwind: desde aquí el índice va en una columna lateral fija.
const ESCRITORIO = '(min-width: 64rem)';

// Contenido de cada documento por idioma: se descarga solo el del idioma activo.
const CONTENIDOS = import.meta.glob(['./contenido/terminos.*.js', './contenido/privacidad.*.js']);

const legalKeys ={ documento: (documento, idioma) => ['legal', documento, idioma] };

function useDocumento(documento) {
  const { i18n } = useTranslation();
  const idioma = IDIOMAS.includes(i18n.resolvedLanguage) ? i18n.resolvedLanguage : 'es';
  return useQuery({
    queryKey: legalKeys.documento(documento, idioma),
    queryFn: async () => (await CONTENIDOS[`./contenido/${documento}.${idioma}.js`]()).default,
    staleTime: Infinity,
    // Al cambiar de idioma se sigue mostrando el texto anterior hasta que llega el nuevo
    placeholderData: (anterior) => anterior,
  });
}

// Sección que se está leyendo: la primera cuyo título cruza el tercio superior de la pantalla.
function useSeccionActiva(ids) {
  const [activa, setActiva] = useState(null);
  const clave = ids.join('|');

  useEffect(() => {
    if (!clave || typeof IntersectionObserver === 'undefined') return undefined;
    const lista = clave.split('|');
    const visibles = new Set();
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const { target, isIntersecting } of entradas) {
          if (isIntersecting) visibles.add(target.id);
          else visibles.delete(target.id);
        }
        const primera = lista.find((id) => visibles.has(id));
        if (primera) setActiva(primera);
      },
      { rootMargin: '-15% 0px -65% 0px' },
    );
    for (const id of lista) {
      const seccion = document.getElementById(id);
      if (seccion) observador.observe(seccion);
    }
    return () => observador.disconnect();
  }, [clave]);

  return activa;
}

function Indice({ secciones, activa, onElegir }) {
  return (
    <ol className="grid border-l border-border">
      {secciones.map(({ id, titulo }, i) => (
        <li key={id}>
          <a
            href={`#${id}`}
            onClick={onElegir}
            aria-current={activa === id ? 'location' : undefined}
            className="-ml-px flex gap-2 border-l-2 border-transparent py-1.5 pl-4 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground aria-[current=location]:border-primary aria-[current=location]:font-semibold aria-[current=location]:text-foreground motion-reduce:transition-none"
          >
            <span className="tabular-nums">{i + 1}.</span>
            <span>{titulo}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

function IndiceSkeleton() {
  return (
    <div className="grid gap-3 border-l border-border pl-4" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="h-4 w-4/5" />
      ))}
    </div>
  );
}

function Bloque({ bloque }) {
  if (typeof bloque === 'string') {
    return (
      <p>
        <TextoLegal texto={bloque} />
      </p>
    );
  }
  if (bloque.subtitulo) {
    return <h3 className="pt-2 text-h4 font-semibold">{bloque.subtitulo}</h3>;
  }
  if (bloque.lista) {
    return (
      <ul className="grid list-disc gap-2 pl-5 marker:text-muted-foreground">
        {bloque.lista.map((item) => (
          <li key={item} className="pl-1">
            <TextoLegal texto={item} />
          </li>
        ))}
      </ul>
    );
  }
  const { leyenda, columnas, filas } = bloque.tabla;
  return (
    // En móvil la tabla puede desplazarse en horizontal (también con el teclado)
    <div
      role="region"
      aria-label={leyenda}
      tabIndex={0}
      className="-mx-1 overflow-x-auto px-1 focus-visible:outline-2 focus-visible:outline-ring"
    >
      <table className="w-full min-w-[30rem] border-collapse text-sm">
        <caption className="pb-3 text-left text-sm text-muted-foreground">{leyenda}</caption>
        <thead>
          <tr className="border-b border-foreground/30">
            {columnas.map((columna) => (
              <th key={columna} scope="col" className="py-2 pr-4 text-left font-semibold">
                {columna}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map(([primera, ...resto]) => (
            <tr key={primera} className="border-b border-border">
              <th scope="row" className="py-2.5 pr-4 text-left align-top font-semibold">
                {primera}
              </th>
              {resto.map((celda, i) => (
                <td key={i} className="py-2.5 pr-4 align-top tabular-nums">
                  {celda}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Seccion({ seccion: { id, titulo, bloques }, numero }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titulo`}
      className="grid scroll-mt-[calc(var(--spacing-header-compact)+1.5rem)] gap-4 border-t border-border pt-8 first:border-t-0 first:pt-0"
    >
      <h2 id={`${id}-titulo`} className="text-h3">
        {numero}. {titulo}
      </h2>
      {bloques.map((bloque, i) => (
        <Bloque key={i} bloque={bloque} />
      ))}
    </section>
  );
}

/**
 * Documento legal de la tienda (Términos, Privacidad): título, fecha de última actualización,
 * índice lateral fijo en escritorio (plegable en móvil) que marca la sección que se lee, y el
 * texto en una columna de lectura. Sin animaciones.
 */
export function DocumentoLegal({ documento }) {
  const { t, i18n } = useTranslation();
  const [indiceAbierto, setIndiceAbierto] = useState(false);
  const { data, isPending, isError, refetch } = useDocumento(documento);
  const secciones = useMemo(() => data?.secciones ?? [], [data]);
  const ids = useMemo(() => secciones.map((s) => s.id), [secciones]);
  const activa = useSeccionActiva(ids);
  const escritorio = useMediaQuery(ESCRITORIO);

  const titulo = t(`legal.${documento}.titulo`);
  const { actualizado } = DOCUMENTOS[documento];
  const otro = documento === 'terminos' ? 'privacidad' : 'terminos';

  return (
    <div className="container-page py-10 sm:py-14">
      <title>{`${titulo} · Kuski`}</title>

      <header className="grid max-w-3xl gap-4 border-b border-border pb-8">
        {/* «Datenschutzerklärung» no cabe en 375 px: se parte (con guion si el navegador
            sabe separar sílabas en alemán) en vez de desbordar la página */}
        <h1 className="text-h1 [overflow-wrap:anywhere]">{titulo}</h1>
        {data ? (
          <p className="text-lead text-muted-foreground">{data.resumen}</p>
        ) : (
          isPending && <Skeleton className="h-16 w-full max-w-2xl" />
        )}
        <p className="text-sm text-muted-foreground">
          {t('legal.actualizado')}{' '}
          <time dateTime={actualizado} className="font-semibold text-foreground">
            {formatDate(`${actualizado}T12:00:00`, i18n.resolvedLanguage, { dateStyle: 'long' })}
          </time>
        </p>
      </header>

      <div
        className={cn(
          'grid gap-8 pt-8',
          escritorio && 'grid-cols-[15rem_minmax(0,1fr)] gap-16 pt-12',
        )}
      >
        {/* Escritorio: índice fijo junto al texto. Solo se monta un índice a la vez. */}
        {escritorio && (
          <aside>
            <nav
              aria-label={t('legal.indice')}
              className="sticky top-[calc(var(--spacing-header-compact)+1.5rem)] grid max-h-[calc(100dvh-var(--spacing-header-compact)-3rem)] gap-4 overflow-y-auto pb-4"
            >
              <p className="text-sm font-semibold">{t('legal.indice')}</p>
              {data ? <Indice secciones={secciones} activa={activa} /> : <IndiceSkeleton />}
            </nav>
          </aside>
        )}

        <div className="grid min-w-0 content-start gap-10">
          {/* Móvil y tablet: índice plegable antes del texto */}
          {!escritorio && data && (
            <details
              open={indiceAbierto}
              onToggle={(e) => setIndiceAbierto(e.currentTarget.open)}
              className="group rounded-surface border border-border bg-surface"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                {t('legal.indice')}
                <ChevronDown
                  className="size-4 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </summary>
              <nav aria-label={t('legal.indice')} className="px-4 pb-4">
                <Indice
                  secciones={secciones}
                  activa={activa}
                  onElegir={() => setIndiceAbierto(false)}
                />
              </nav>
            </details>
          )}

          {isError ? (
            <SectionError onRetry={refetch} />
          ) : isPending ? (
            <div className="grid max-w-[68ch] gap-4" aria-busy="true">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <article className="grid max-w-[68ch] gap-10 leading-relaxed">
              {secciones.map((seccion, i) => (
                <Seccion key={seccion.id} seccion={seccion} numero={i + 1} />
              ))}
            </article>
          )}

          <p className="max-w-[68ch] border-t border-border pt-6 text-sm text-muted-foreground">
            {t('legal.verTambien')}{' '}
            <Link
              to={DOCUMENTOS[otro].ruta}
              className="font-semibold text-link underline decoration-1 underline-offset-4 hover:decoration-2"
            >
              {t(`legal.${otro}.titulo`)}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
