import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategorias } from '@/features/catalogo/api';
import { formatNumber } from '@/lib/format';
import { imagenResponsive } from '@/lib/imagenes';
import { useReducedMotion } from '@/lib/motion';
import { Link } from '@/lib/motion/enlaces';
import { conMovimiento, gsap, useGSAP } from '@/lib/motion/gsap';
import { ScrollTrigger } from '@/lib/motion/scroll-trigger';
import { useLenisRef } from '@/lib/motion/lenis-context';
import { useMediaQuery } from '@/lib/use-media-query';
import { cn } from '@/lib/utils';
import {
  altitudDeCategoria,
  MARCAS_REGLA,
  marcasRegla,
  ordenarCategorias,
  pisoDe,
  PISOS,
  posicionEnRegla,
  REGLA,
} from './altitud';
import { SectionError, SectionHeading } from './section-heading';

/*
 * "Del valle a la puna": el momento memorable de la tienda. En escritorio la sección queda
 * fija (pin) y el scroll sube por Cusco: el altímetro del borde pasa de la comunidad más baja
 * a la más alta, el fondo cambia de piso (Musgo → Ichu → Puna), las montañas quedan abajo a
 * distinta velocidad y cada categoría aparece a la altitud de su comunidad principal.
 * Solo se animan transform y opacity; la cifra del altímetro se escribe en el DOM sin React.
 *
 * Móvil (o pantallas bajas): lista vertical sin pin, con el altímetro como línea lateral.
 * Movimiento reducido: la misma lista, estática (en escritorio, en cuatro columnas).
 */

const ESCRITORIO = '(min-width: 64rem) and (min-height: 40rem)';

// Fondo y texto de cada piso. Ichu nunca como texto: sobre Ichu, el texto es Puna.
const FONDO = { valle: 'bg-musgo', ladera: 'bg-ichu', altura: 'bg-puna' };
const TEXTO = {
  valle: 'text-niebla [--ring:var(--color-niebla)]',
  ladera: 'text-puna [--ring:var(--color-puna)]',
  altura: 'text-niebla [--ring:var(--color-niebla)]',
};

// Escritorio: el rail del altímetro (franja Puna) y el desplazamiento de cada panel al entrar.
const RAIL = 'w-28 xl:w-32';
const DESPLAZAMIENTO = 48;

// Montañas en tres planos (del fondo al frente): cuanto más cerca, más rápido bajan al subir.
const PLANOS = [
  { alto: '46%', base: 250, picos: 3.2, fase: 0.6, amplitud: 120, opacidad: 0.16, baja: 12 },
  { alto: '34%', base: 260, picos: 4.6, fase: 2.1, amplitud: 110, opacidad: 0.28, baja: 30 },
  { alto: '22%', base: 270, picos: 6.4, fase: 4.0, amplitud: 95, opacidad: 0.45, baja: 70 },
];

const crestaDe = ({ base, picos, fase, amplitud }) => {
  const puntos = [];
  for (let x = 0; x <= 1440; x += 24) {
    const t = x / 1440;
    const y =
      base -
      amplitud * Math.abs(Math.sin(t * Math.PI * picos + fase)) ** 1.6 -
      0.25 * amplitud * Math.sin(t * Math.PI * picos * 2.7 + fase * 1.7);
    puntos.push(`${x},${Math.max(4, y).toFixed(1)}`);
  }
  return `M0,320 L${puntos.join(' L')} L1440,320 Z`;
};

const CRESTAS = PLANOS.map(crestaDe);

function useNombreCategoria(categoria) {
  const { t } = useTranslation();
  return t(`catalogo.categorias.${categoria.slug}.nombre`, { defaultValue: categoria.nombre });
}

// Contenido de una categoría (común a todas las variantes): nombre, altitud, origen y enlace.
function DatosCategoria({ categoria, className }) {
  const { t, i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;
  const nombre = useNombreCategoria(categoria);
  const altitud = altitudDeCategoria(categoria);
  const { altitudMin, altitudMax, comunidadPrincipal } = categoria;

  return (
    <div className={cn('grid content-start gap-3', className)}>
      <h3 className="text-h3">{nombre}</h3>
      {altitud != null && (
        <p className="order-first font-display text-h1 font-medium tracking-tight tabular-nums">
          {formatNumber(altitud, idioma)}{' '}
          <span className="font-sans text-lead font-semibold">{t('home.recorrido.unidad')}</span>
        </p>
      )}
      {comunidadPrincipal && (
        <p className="font-semibold">
          {t('home.categorias.origen', { comunidad: comunidadPrincipal.nombre })}
        </p>
      )}
      <p className="text-sm">
        {[
          altitudMin != null &&
            altitudMin !== altitudMax &&
            t('home.categorias.rango', {
              min: formatNumber(altitudMin, idioma),
              max: formatNumber(altitudMax, idioma),
            }),
          categoria.totalProductos != null &&
            t('home.categorias.productos', { count: categoria.totalProductos }),
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>
      <p className="pt-2">
        <Link
          to={`/catalogo?categoria=${categoria.slug}`}
          className="inline-flex min-h-11 items-center font-semibold underline decoration-1 underline-offset-[6px] hover:decoration-2"
        >
          {t(`home.categorias.ver.${categoria.slug}`, {
            defaultValue: t('home.categorias.verCategoria', { nombre }),
          })}
        </Link>
      </p>
    </div>
  );
}

function FotoCategoria({ categoria, className }) {
  return (
    <div className={cn('relative overflow-hidden bg-current/10', className)}>
      {categoria.imagenUrl && (
        <img
          {...imagenResponsive(categoria.imagenUrl)}
          sizes="(min-width: 64rem) 32rem, 100vw"
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
      )}
    </div>
  );
}

// ─── Escritorio: recorrido con pin ────────────────────────────────────────────────────────────

function Montanas() {
  return PLANOS.map((plano, k) => (
    <svg
      key={k}
      data-plano={k}
      aria-hidden="true"
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
      className="absolute inset-x-0 bottom-0 -z-10 w-full text-puna will-change-transform"
      style={{ height: plano.alto }}
    >
      <path d={CRESTAS[k]} fill="currentColor" fillOpacity={plano.opacidad} />
    </svg>
  ));
}

// Altímetro de cinta: la regla (1,000–4,000 m) se desplaza bajo una línea índice fija que
// marca la altitud actual. Ichu sobre Puna (6.56:1). Decorativo: la altitud está en cada panel.
function Altimetro({ altitudes, inicio, lecturaRef }) {
  const { t, i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;

  return (
    <div
      aria-hidden="true"
      className={cn('absolute inset-y-0 left-0 z-10 overflow-hidden bg-puna text-ichu', RAIL)}
    >
      <div data-cinta className="absolute inset-x-0 bottom-1/2 h-[300%] will-change-transform">
        <div
          className="absolute inset-y-0 right-0 w-3 opacity-40"
          style={{ background: marcasRegla(30) }}
        />
        <div
          className="absolute inset-y-0 right-0 w-6 opacity-70"
          style={{ background: marcasRegla(6) }}
        />
        {MARCAS_REGLA.map((marca) => (
          <span
            key={marca}
            className="absolute right-8 translate-y-1/2 text-xs tabular-nums"
            style={{ bottom: `${posicionEnRegla(marca) * 100}%` }}
          >
            {formatNumber(marca, idioma)}
          </span>
        ))}
        {altitudes.map((altitud) => (
          <span
            key={altitud}
            className="absolute right-0 h-0.5 w-10 translate-y-1/2 bg-ichu"
            style={{ bottom: `${posicionEnRegla(altitud) * 100}%` }}
          />
        ))}
      </div>

      {/* Línea índice y lectura actual */}
      <div className="absolute inset-x-0 top-1/2 h-0.5 bg-ichu" />
      <p className="absolute inset-x-0 bottom-1/2 grid gap-0.5 bg-puna px-3 pb-2 xl:px-4">
        <span ref={lecturaRef} className="font-display text-xl font-medium tabular-nums">
          {formatNumber(inicio, idioma)}
        </span>
        <span className="text-xs">{t('home.recorrido.unidad')}</span>
      </p>
      <p className="absolute inset-x-0 top-0 bg-puna px-3 pt-[calc(var(--spacing-header-compact)+1rem)] pb-3 text-xs xl:px-4">
        {t('home.perfil.puna', { valor: formatNumber(REGLA.max, idioma) })}
      </p>
    </div>
  );
}

function Recorrido({ categorias }) {
  const { t, i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;
  const escena = useRef(null);
  const lecturaRef = useRef(null);
  const irARef = useRef(null);
  const lenisRef = useLenisRef();

  const altitudes = useMemo(() => categorias.map(altitudDeCategoria), [categorias]);
  const pisos = altitudes.map(pisoDe);
  // El recorrido termina en la comunidad más alta del rango de la última categoría
  const cima = Math.max(...categorias.map((c, i) => c.altitudMax ?? altitudes[i]));

  useGSAP(
    () => {
      conMovimiento(() => {
        const q = gsap.utils.selector(escena);
        const paneles = q('[data-panel]');
        const lectura = lecturaRef.current;
        const moverCinta = gsap.quickSetter(q('[data-cinta]'), 'yPercent');
        const suave = gsap.parseEase('suave');

        // La altitud es función del tiempo de la línea (tramos de subida con la curva 'suave'):
        // no depende del orden en que GSAP pinta las interpolaciones al ir y volver
        const tramos = [];
        const altitudEn = (tiempo) => {
          let altitud = altitudes[0];
          for (const { desde, hasta, de, a } of tramos) {
            if (tiempo <= desde) break;
            altitud = de + (a - de) * suave(Math.min(1, (tiempo - desde) / (hasta - desde)));
          }
          return altitud;
        };
        const pintar = () => {
          const altitud = altitudEn(linea.time());
          moverCinta(posicionEnRegla(altitud) * 100);
          lectura.textContent = formatNumber(Math.round(altitud), idioma);
        };

        // Valores explícitos (fromTo) y sin immediateRender: el resultado es el mismo al bajar,
        // al volver atrás o al cargar la página con el scroll ya avanzado
        const linea = gsap.timeline({
          defaults: { ease: 'none', immediateRender: false },
          onUpdate: () => pintar(),
          scrollTrigger: {
            trigger: escena.current,
            start: 'top top',
            end: () => `+=${window.innerHeight * categorias.length}`,
            pin: true,
            scrub: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onRefresh: () => pintar(),
          },
        });

        // Tramos: una pausa por categoría y una subida entre cada par
        const PAUSA = 1;
        const SUBIDA = 1;
        const indicePiso = (i) => PISOS.findIndex((p) => p.id === pisos[i]);

        linea.addLabel('c0', 0).to({}, { duration: PAUSA * 0.6 });
        for (let i = 1; i < paneles.length; i += 1) {
          const t0 = linea.duration();
          const mitad = t0 + SUBIDA / 2;
          linea
            .fromTo(
              paneles[i - 1],
              { opacity: 1, y: 0 },
              { opacity: 0, y: -DESPLAZAMIENTO, duration: SUBIDA / 2, ease: 'suave' },
              t0,
            )
            .set(paneles[i - 1], { pointerEvents: 'none' }, mitad)
            .fromTo(
              paneles[i],
              { opacity: 0, y: DESPLAZAMIENTO },
              { opacity: 1, y: 0, duration: SUBIDA / 2, ease: 'salida' },
              mitad,
            )
            .set(paneles[i], { pointerEvents: 'auto' }, mitad);
          tramos.push({ desde: t0, hasta: t0 + SUBIDA, de: altitudes[i - 1], a: altitudes[i] });

          // Capas de fondo apiladas (ladera sobre valle, altura sobre ladera)
          PISOS.slice(1).forEach((piso, k) => {
            const antes = indicePiso(i - 1) >= k + 1;
            const despues = indicePiso(i) >= k + 1;
            if (antes !== despues) {
              linea.fromTo(
                q(`[data-fondo="${piso.id}"]`),
                { opacity: antes ? 1 : 0 },
                { opacity: despues ? 1 : 0, duration: SUBIDA },
                t0,
              );
            }
          });

          linea.addLabel(`c${i}`, t0 + SUBIDA).to({}, { duration: PAUSA }, t0 + SUBIDA);
        }
        // En la última pausa el altímetro termina de subir hasta la cima del rango
        const ultima = linea.labels[`c${paneles.length - 1}`];
        tramos.push({ desde: ultima, hasta: ultima + PAUSA, de: altitudes.at(-1), a: cima });

        // Parallax suave de las montañas durante todo el recorrido
        pintar();
        q('[data-plano]').forEach((plano, k) =>
          linea.fromTo(
            plano,
            { yPercent: 0 },
            { yPercent: PLANOS[k].baja, duration: linea.duration() },
            0,
          ),
        );

        // Un enlace enfocado con el teclado lleva el scroll a su panel (los demás son invisibles)
        irARef.current = (i) => {
          const disparador = linea.scrollTrigger;
          const y =
            disparador.start +
            (disparador.end - disparador.start) * (linea.labels[`c${i}`] / linea.duration());
          if (lenisRef?.current) lenisRef.current.scrollTo(y, { immediate: true });
          else window.scrollTo(0, y);
        };

        // Si cambia la altura de lo que hay arriba (datos, fuentes), recalcula dónde empieza
        let espera;
        const observador = new ResizeObserver(() => {
          espera?.kill();
          espera = gsap.delayedCall(0.2, () => ScrollTrigger.refresh());
        });
        for (let nodo = escena.current.closest('section')?.previousElementSibling; nodo;) {
          observador.observe(nodo);
          nodo = nodo.previousElementSibling;
        }

        return () => {
          observador.disconnect();
          espera?.kill();
          irARef.current = null;
        };
      });
    },
    { scope: escena, dependencies: [categorias, idioma], revertOnUpdate: true },
  );

  return (
    <div
      ref={escena}
      className="relative isolate h-svh overflow-hidden text-niebla"
      data-testid="recorrido-categorias"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-20 bg-musgo" />
      {PISOS.slice(1).map((piso) => (
        <div
          key={piso.id}
          data-fondo={piso.id}
          aria-hidden="true"
          className={cn(
            'absolute inset-0 -z-20 will-change-[opacity]',
            FONDO[piso.id],
            piso.id !== pisos[0] && 'opacity-0',
          )}
        />
      ))}
      <Montanas />
      <Altimetro altitudes={altitudes} inicio={altitudes[0]} lecturaRef={lecturaRef} />

      <ol
        aria-label={t('home.categorias.lista')}
        className="absolute inset-y-0 right-0 left-28 xl:left-32"
      >
        {categorias.map((categoria, i) => (
          <li
            key={categoria.id}
            data-panel={i}
            onFocus={() => irARef.current?.(i)}
            className={cn(
              'absolute inset-0 will-change-[transform,opacity]',
              TEXTO[pisos[i]],
              i > 0 && 'pointer-events-none opacity-0',
            )}
          >
            <div className="container-page grid h-full grid-cols-[minmax(0,5fr)_minmax(0,6fr)] items-center gap-12 pt-[calc(var(--spacing-header-compact)+1.5rem)] pb-10 xl:gap-20">
              <div className="grid gap-10">
                {i === 0 && (
                  <div className="grid max-w-xl gap-4">
                    <h2 id="categorias-titulo" className="text-h2">
                      {t('home.categorias.titulo')}
                    </h2>
                    <p className="text-lead">{t('home.categorias.descripcion')}</p>
                  </div>
                )}
                <DatosCategoria categoria={categoria} />
              </div>
              <FotoCategoria
                categoria={categoria}
                className="aspect-4/5 h-[min(64svh,42rem)] justify-self-end"
              />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ─── Móvil y movimiento reducido: lista vertical ──────────────────────────────────────────────

function Lista({ categorias }) {
  const { t } = useTranslation();
  const lista = useRef(null);

  // La línea del altímetro se llena al bajar (sin pin); con movimiento reducido queda llena
  useGSAP(
    () => {
      conMovimiento(() => {
        gsap.fromTo(
          '[data-relleno]',
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: lista.current,
              start: 'top 70%',
              end: 'bottom 70%',
              scrub: true,
            },
          },
        );
      });
    },
    { scope: lista, dependencies: [categorias] },
  );

  return (
    <div ref={lista} className="relative -mx-gutter sm:mx-0">
      {/* Altímetro lateral: franja Puna con la línea Ichu (solo en la versión vertical) */}
      <div aria-hidden="true" className="absolute inset-y-0 left-0 z-10 w-10 bg-puna lg:hidden">
        <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-ichu/35" />
        <span
          data-relleno
          className="absolute inset-y-0 left-1/2 w-0.5 origin-top -translate-x-1/2 bg-ichu will-change-transform"
        />
      </div>
      <ol aria-label={t('home.categorias.lista')} className="grid lg:grid-cols-4">
        {categorias.map((categoria) => {
          const piso = pisoDe(altitudDeCategoria(categoria) ?? REGLA.min);
          return (
            <li
              key={categoria.id}
              className={cn(
                'relative grid gap-6 py-10 pr-gutter pl-16 sm:grid-cols-[minmax(0,1fr)_14rem] sm:items-center lg:grid-cols-1 lg:content-start lg:p-6 xl:p-8',
                FONDO[piso],
                TEXTO[piso],
              )}
            >
              {/* Marca de la parada sobre la línea */}
              <span
                aria-hidden="true"
                className="absolute top-12 left-5 z-10 size-3 -translate-x-1/2 rounded-full bg-ichu ring-4 ring-puna lg:hidden"
              />
              <DatosCategoria categoria={categoria} />
              <FotoCategoria
                categoria={categoria}
                className="order-first aspect-4/3 sm:order-none lg:order-first lg:aspect-4/5"
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function CategoriasAltitud() {
  const { t } = useTranslation();
  const { data, isPending, isError, refetch } = useCategorias();
  const escritorio = useMediaQuery(ESCRITORIO);
  const reducido = useReducedMotion();

  const categorias = useMemo(() => ordenarCategorias(data ?? []).slice(0, 4), [data]);

  if (escritorio && !reducido && categorias.length > 0) {
    return (
      <section aria-labelledby="categorias-titulo" className="pb-section">
        <Recorrido categorias={categorias} />
      </section>
    );
  }

  return (
    <section aria-labelledby="categorias-titulo" className="container-page grid gap-10 pb-section">
      <SectionHeading
        id="categorias-titulo"
        title={t('home.categorias.titulo')}
        description={t('home.categorias.descripcion')}
      />
      {isError ? (
        <SectionError onRetry={refetch} />
      ) : isPending ? (
        <ul aria-busy="true" className="grid gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i}>
              <Skeleton className="h-64 lg:h-96" />
            </li>
          ))}
        </ul>
      ) : (
        <Lista categorias={categorias} />
      )}
    </section>
  );
}
