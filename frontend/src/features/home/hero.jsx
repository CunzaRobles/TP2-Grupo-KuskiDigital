import { ArrowDown } from 'lucide-react';
import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useComunidades } from '@/features/catalogo/api';
import { formatNumber } from '@/lib/format';
import { Link } from '@/lib/motion/enlaces';
import { conMovimiento, gsap, useGSAP } from '@/lib/motion/gsap';
import { SplitText } from '@/lib/motion/split-text';
import { marcasRegla, nombreCorto, ordenarPorAltitud, posicionEnRegla } from './altitud';
import { PerfilAltitud } from './perfil-altitud';

// Placeholder de Unsplash (verificado): el valle del Urubamba con el pueblo al pie de los cerros.
// Es el punto de partida del recorrido: el valle, antes de subir.
const FOTO = 'https://images.unsplash.com/photo-1665819922368-33dafd456067';
const ANCHOS = [480, 768, 1080, 1440, 1920];
const srcDe = (ancho) => `${FOTO}?auto=format&fit=crop&w=${ancho}&q=70`;

// Capa de legibilidad (no decorativa): oscurece arriba para el header transparente y abajo
// para el titular, que van en Niebla sobre la foto.
const VELO =
  'linear-gradient(to bottom, rgb(27 36 64 / 0.55), rgb(27 36 64 / 0) 26%, rgb(27 36 64 / 0.1) 45%, rgb(27 36 64 / 0.88))';

// Curvas de nivel: líneas que se anidan como en un mapa topográfico (motivo de la marca).
const CURVAS = Array.from({ length: 9 }, (_, k) => {
  const puntos = [];
  for (let x = 0; x <= 1440; x += 40) {
    const y =
      900 -
      k * 46 -
      70 * Math.sin((x / 1440) * Math.PI * 1.15 + 0.4) -
      (24 - k * 1.5) * Math.sin((x / 1440) * Math.PI * 3.2 + k * 0.35);
    puntos.push(`${x},${y.toFixed(1)}`);
  }
  return `M${puntos.join(' L')}`;
});

/**
 * Hero a pantalla completa con la foto del valle. Es la única animación automática de la carga:
 * el titular entra por líneas (SplitText) y luego el texto, el CTA y la indicación de scroll
 * (≤ 1.2 s en total). Con movimiento reducido no hay secuencia: todo está visible de inmediato.
 * Debajo, el perfil de altitud de las comunidades (el mapa del recorrido).
 */
export function Hero() {
  const { t, i18n } = useTranslation();
  const escena = useRef(null);
  const { data } = useComunidades();
  const inicio = useMemo(() => ordenarPorAltitud(data ?? [])[0], [data]);

  useGSAP(
    () => {
      conMovimiento(() => {
        const q = gsap.utils.selector(escena);
        const linea = gsap.timeline({ defaults: { ease: 'salida' } });
        linea
          .from(q('[data-hero="foto"]'), { scale: 1.04, duration: 1.2, ease: 'suave' }, 0)
          .from(
            q('[data-hero="entra"]'),
            { autoAlpha: 0, y: 12, duration: 0.5, stagger: 0.08 },
            0.5,
          );

        // autoSplit vuelve a partir el titular al cargar la fuente o cambiar el ancho; la
        // animación que devuelve onSplit conserva su progreso.
        SplitText.create(q('#hero-titulo'), {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, { yPercent: 105, duration: 0.75, stagger: 0.1, ease: 'salida' }),
        });
      });
    },
    { scope: escena },
  );

  return (
    <section aria-labelledby="hero-titulo">
      {/* -mt-header: la foto sube detrás del header, que es transparente sobre ella */}
      <div
        ref={escena}
        className="relative isolate -mt-header flex min-h-svh flex-col overflow-hidden bg-puna text-niebla [--ring:var(--color-niebla)]"
      >
        <img
          data-hero="foto"
          src={srcDe(1440)}
          srcSet={ANCHOS.map((a) => `${srcDe(a)} ${a}w`).join(', ')}
          sizes="100vw"
          alt={t('home.hero.imagenAlt')}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 -z-20 size-full object-cover object-[50%_62%]"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: VELO }} />
        <svg
          aria-hidden="true"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMax slice"
          className="absolute inset-0 -z-10 size-full text-niebla opacity-15"
        >
          {CURVAS.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        <ReglaHero altitud={inicio?.altitudMsnm} />

        <div className="container-page flex flex-1 flex-col justify-end gap-6 pt-[calc(var(--spacing-header)+3rem)] pr-12 pb-10 sm:gap-8 sm:pr-16 sm:pb-14">
          <h1 id="hero-titulo" className="max-w-[12ch] text-display text-niebla">
            {t('home.hero.titulo')}
          </h1>

          <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div className="grid gap-6">
              <p data-hero="entra" className="max-w-xl text-lead text-niebla/90">
                {t('home.hero.descripcion')}
              </p>
              <div data-hero="entra">
                <Button
                  asChild
                  size="lg"
                  className="bg-niebla text-puna shadow-none hover:bg-blanco"
                >
                  <Link to="/catalogo">{t('home.hero.cta')}</Link>
                </Button>
              </div>
            </div>

            {/* Indicación de scroll: el inicio del altímetro (la comunidad más baja) */}
            <p data-hero="entra" className="flex items-end gap-3 md:justify-end md:text-right">
              <ArrowDown className="mb-1 size-4 shrink-0 md:order-last" aria-hidden="true" />
              <span className="grid min-h-12 content-end gap-0.5">
                {inicio && (
                  <span className="font-display text-xl leading-tight font-medium tabular-nums">
                    {formatNumber(inicio.altitudMsnm, i18n.resolvedLanguage)}{' '}
                    {t('home.recorrido.unidad')}
                  </span>
                )}
                <span className="text-sm text-niebla/85">
                  {inicio
                    ? t('home.hero.inicio', { lugar: nombreCorto(inicio.nombre) })
                    : t('home.hero.desliza')}
                </span>
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="container-page pt-10 pb-section sm:pt-14">
        <PerfilAltitud />
      </div>
    </section>
  );
}

// Regla del altímetro en el borde derecho: marcas cada 100 m y cada 500 m, de 1,000 m (abajo)
// a 4,000 m (arriba). La marca Ichu señala el inicio del recorrido, junto a la indicación.

function ReglaHero({ altitud }) {
  return (
    <div
      aria-hidden="true"
      className="absolute top-[calc(var(--spacing-header)+1.5rem)] right-0 bottom-10 w-8 border-t border-niebla/60 text-niebla sm:bottom-14 sm:w-12"
    >
      <div
        className="absolute inset-y-0 right-0 w-2.5 opacity-35 sm:w-3.5"
        style={{ background: marcasRegla(30) }}
      />
      <div
        className="absolute inset-y-0 right-0 w-5 opacity-60 sm:w-7"
        style={{ background: marcasRegla(6) }}
      />
      {altitud != null && (
        <span
          className="absolute right-0 h-0.5 w-full translate-y-1/2 bg-ichu"
          style={{ bottom: `${posicionEnRegla(altitud) * 100}%` }}
        />
      )}
    </div>
  );
}
