import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/layout/logo';
import { CurrencySelect, LanguageSelect } from '@/components/layout/preference-selects';
import { Button } from '@/components/ui/button';
import { MarcasRegla } from '@/components/ui/marcas-regla';
import { ThemeScope } from '@/components/ui/theme-scope';
import { contrastRatio } from '@/lib/contrast';
import { CURVA, cubicBezier, DURACION, milisegundos, useReducedMotion } from '@/lib/motion';
import { gsap } from '@/lib/motion/gsap';
import { Muestrario } from './muestrario';

// Solo desarrollo (ver app/router.jsx). Referencia visual del design system de la tienda
// ("Del valle a la puna") y del panel admin ("editorial andino").

const NIEBLA = '#EEF0EC';
const BLANCO = '#FFFFFF';
const PUNA = '#1B2440';

// `fondo`: contra qué se mide el contraste según la regla de uso (CLAUDE.md)
const PALETA = [
  { nombre: 'Puna', token: 'puna', hex: PUNA, texto: NIEBLA, uso: 'Texto y banda oscura' },
  {
    nombre: 'Cochinilla',
    token: 'cochinilla',
    hex: '#A3123A',
    texto: BLANCO,
    uso: 'Único acento: CTA, "+", carrito',
  },
  {
    nombre: 'Cochinilla 700',
    token: 'cochinilla-700',
    hex: '#7C1232',
    texto: BLANCO,
    uso: 'Hover del acento',
  },
  {
    nombre: 'Ichu',
    token: 'ichu',
    hex: '#C9A55A',
    texto: PUNA,
    uso: 'Solo sobre Puna o detrás de texto Puna',
    fondo: 'puna',
  },
  {
    nombre: 'Musgo',
    token: 'musgo',
    hex: '#3E5A3A',
    texto: BLANCO,
    uso: 'Éxito y certificaciones',
  },
  { nombre: 'Niebla', token: 'niebla', hex: NIEBLA, texto: PUNA, uso: 'Fondo de la tienda' },
  { nombre: 'Blanco', token: 'blanco', hex: BLANCO, texto: PUNA, uso: 'Superficies' },
  {
    nombre: 'Niebla texto',
    token: 'niebla-texto',
    hex: '#5B6270',
    texto: BLANCO,
    uso: 'Texto secundario',
  },
  {
    nombre: 'Niebla borde',
    token: 'niebla-borde',
    hex: '#838A82',
    texto: BLANCO,
    uso: 'Borde de controles (≥ 3:1)',
  },
  {
    nombre: 'Error',
    token: 'error',
    hex: '#9A3412',
    texto: BLANCO,
    uso: 'Errores, siempre con ícono',
  },
];

const PALETA_ADMIN = [
  { nombre: 'Café', hex: '#2B1D14' },
  { nombre: 'Terracota', hex: '#B5532C' },
  { nombre: 'Maíz', hex: '#D9A441' },
  { nombre: 'Crema', hex: '#F5EFE4' },
  { nombre: 'Alpaca', hex: '#FBF9F5' },
  { nombre: 'Verde', hex: '#4F6B4A' },
];

const ESCALA = [
  {
    clase: 'font-display text-display font-medium',
    muestra: 'Del valle a la puna',
    meta: 'Display · Unbounded',
  },
  {
    clase: 'font-display text-h1 font-medium',
    muestra: 'Textiles de altura',
    meta: 'H1 · Unbounded',
  },
  {
    clase: 'font-display text-h2 font-medium',
    muestra: 'Comunidades de Cusco',
    meta: 'H2 · Unbounded',
  },
  {
    clase: 'font-heading text-h3 font-semibold',
    muestra: 'Quinua roja de Anta',
    meta: 'H3 · Hanken Grotesk',
  },
  {
    clase: 'font-heading text-h4 font-semibold',
    muestra: 'Origen y trazabilidad',
    meta: 'H4 · Hanken Grotesk',
  },
  {
    clase: 'font-display text-h2 font-medium tabular-nums',
    muestra: '3,760 msnm',
    meta: 'Cifra de altitud · Unbounded',
  },
  {
    clase: 'text-lead',
    muestra: 'Cosechado a 3,400 msnm por la comunidad de Chinchero.',
    meta: 'Lead · Hanken Grotesk',
  },
  {
    clase: 'text-base',
    muestra: 'Texto base para descripciones de producto.',
    meta: 'Base · Hanken Grotesk 16px',
  },
  {
    clase: 'text-xl font-semibold tabular-nums',
    muestra: 'S/ 1,250.00',
    meta: 'Precio · tabular-nums',
  },
];

// Jerarquía de radios: de lo más pequeño (indicadores) a las capas que flotan
const RADIOS = [
  { clase: 'rounded-none', uso: 'Fotos' },
  { clase: 'rounded-item', uso: 'Ítems de lista, skeletons, checkbox' },
  { clase: 'rounded-field', uso: 'Inputs, selects, cantidad' },
  { clase: 'rounded-button', uso: 'Botones' },
  { clase: 'rounded-surface', uso: 'Tarjetas, avisos, opciones' },
  { clase: 'rounded-popover', uso: 'Menús, toasts' },
  { clase: 'rounded-dialog', uso: 'Diálogos, hoja inferior' },
  { clase: 'rounded-full', uso: 'Indicadores: badges, contador, pasos, botones de icono' },
];

const ELEVACION = [
  { clase: 'shadow-field', uso: 'Campos (sin sombra en la tienda)' },
  { clase: 'shadow-surface', uso: 'Superficies (sin sombra: borde fino)' },
  { clase: 'shadow-overlay', uso: 'Popovers, diálogos, toasts' },
  { clase: 'shadow-sheet', uso: 'Drawers laterales' },
];

function Seccion({ titulo, descripcion, children }) {
  return (
    <section className="grid gap-6">
      <div className="grid gap-1">
        <h2 className="text-h3">{titulo}</h2>
        {descripcion && <p className="max-w-2xl text-sm text-muted-foreground">{descripcion}</p>}
      </div>
      {children}
    </section>
  );
}

function Ratio({ hex, fondo }) {
  const contra =
    fondo === 'puna'
      ? [['puna', PUNA]]
      : [
          ['niebla', NIEBLA],
          ['blanco', BLANCO],
        ];
  return (
    <span className="text-muted-foreground tabular-nums">
      {contra
        .map(([nombre, valor]) => `${nombre} ${contrastRatio(hex, valor).toFixed(2)}`)
        .join(' · ')}
    </span>
  );
}

// Demo de los tokens de movimiento con GSAP (las curvas se registran con nombre en lib/motion/gsap)
function DemoMovimiento() {
  const marcadores = useRef([]);
  const reducido = useReducedMotion();

  const reproducir = () => {
    for (const [i, curva] of Object.keys(CURVA).entries()) {
      const marcador = marcadores.current[i];
      gsap.fromTo(
        marcador,
        { x: 0 },
        {
          x: () => marcador.parentElement.clientWidth - marcador.offsetWidth,
          duration: reducido ? 0 : DURACION.lenta * 2,
          ease: curva,
        },
      );
    }
  };

  return (
    <div className="grid gap-5 rounded-surface border bg-card p-6">
      <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
        {Object.keys(DURACION).map((nombre) => (
          <div key={nombre} className="flex justify-between gap-4 border-b pb-2">
            <dt className="font-semibold">--duracion-{nombre}</dt>
            <dd className="text-muted-foreground tabular-nums">{milisegundos(nombre)} ms</dd>
          </div>
        ))}
        {Object.entries(CURVA).map(([nombre, curva]) => (
          <div key={nombre} className="flex justify-between gap-4 border-b pb-2">
            <dt className="font-semibold">--curva-{nombre}</dt>
            <dd className="text-muted-foreground">{cubicBezier(curva)}</dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-3">
        {Object.keys(CURVA).map((nombre, i) => (
          <div key={nombre} className="grid gap-1">
            <span className="text-xs font-semibold text-muted-foreground">{nombre}</span>
            <div className="relative h-3 rounded-full bg-muted">
              <span
                ref={(nodo) => {
                  marcadores.current[i] = nodo;
                }}
                className="absolute inset-y-0 left-0 w-3 rounded-full bg-primary"
              />
            </div>
          </div>
        ))}
      </div>
      <div>
        <Button variant="secondary" size="sm" onClick={reproducir}>
          Reproducir con GSAP
        </Button>
      </div>
    </div>
  );
}

export function DesignSystemPage() {
  const { i18n } = useTranslation();

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo compact />
            <span className="hidden rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-accent-foreground sm:inline">
              Design system · dev
            </span>
          </div>
          <div className="flex items-center gap-1">
            <LanguageSelect />
            <CurrencySelect />
          </div>
        </div>
      </header>

      <main className="container-page grid gap-16 py-12">
        <div className="grid max-w-3xl gap-4">
          <h1 className="text-h1">Del valle a la puna</h1>
          <p className="text-lead text-muted-foreground">
            Tokens y componentes base de la tienda. Idioma activo:{' '}
            <strong>{i18n.resolvedLanguage}</strong>. Cambia idioma y moneda arriba para ver Price,
            Stepper y los textos de accesibilidad.
          </p>
        </div>

        <Seccion
          titulo="Paleta de la tienda"
          descripcion="Valores de CLAUDE.md y los tres derivados aprobados. Ratio contra Niebla y Blanco (Ichu, contra Puna: es su único fondo permitido). Texto AA ≥ 4.5, controles ≥ 3."
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {PALETA.map((c) => (
              <figure key={c.token} className="overflow-hidden rounded-surface border bg-card">
                <div
                  className="flex h-20 items-end p-3 text-xs font-bold"
                  style={{ background: c.hex, color: c.texto }}
                >
                  Aa
                </div>
                <figcaption className="grid gap-0.5 p-3 text-xs">
                  <span className="font-semibold text-foreground">{c.nombre}</span>
                  <code className="text-muted-foreground">
                    {c.hex} · {c.token}
                  </code>
                  <span className="text-foreground">{c.uso}</span>
                  <Ratio hex={c.hex} fondo={c.fondo} />
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="grid gap-3">
            <p className="text-sm font-semibold">Panel admin ("editorial andino", clase .admin)</p>
            <ul className="flex flex-wrap gap-2">
              {PALETA_ADMIN.map((c) => (
                <li
                  key={c.hex}
                  className="flex items-center gap-2 rounded-field border bg-card px-2.5 py-1.5 text-xs"
                >
                  <span className="size-4 rounded-full border" style={{ background: c.hex }} />
                  {c.nombre} <code className="text-muted-foreground">{c.hex}</code>
                </li>
              ))}
            </ul>
          </div>
        </Seccion>

        <Seccion
          titulo="Tipografía"
          descripcion="Unbounded para h1, h2 y cifras de altitud (con guiones automáticos por el alemán); Hanken Grotesk para el resto. Sin antetítulos en mayúsculas."
        >
          <div className="grid gap-5 rounded-surface border bg-card p-6 sm:p-10">
            {ESCALA.map((e) => (
              <div
                key={e.meta}
                className="grid gap-1 border-b pb-5 last:border-0 last:pb-0 md:grid-cols-[14rem_1fr] md:items-baseline md:gap-6"
              >
                <code className="text-xs text-muted-foreground">{e.meta}</code>
                <p className={e.clase}>{e.muestra}</p>
              </div>
            ))}
          </div>
        </Seccion>

        <Seccion
          titulo="Radios y elevación"
          descripcion="Radios con jerarquía, de los indicadores a los diálogos. Solo proyecta sombra lo que flota sobre la página; campos y superficies se separan con bordes finos."
        >
          <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {RADIOS.map(({ clase, uso }) => (
                <li key={clase} className="grid content-start gap-2">
                  <div className={`h-16 border-2 border-foreground/70 bg-card ${clase}`} />
                  <code className="text-xs font-semibold">{clase}</code>
                  <span className="text-xs text-muted-foreground">{uso}</span>
                </li>
              ))}
            </ul>
            <ul className="grid grid-cols-2 gap-6">
              {ELEVACION.map(({ clase, uso }) => (
                <li
                  key={clase}
                  className={`grid content-center gap-1 rounded-surface border bg-card p-4 ${clase}`}
                >
                  <code className="text-xs font-semibold">{clase}</code>
                  <span className="text-xs text-muted-foreground">{uso}</span>
                </li>
              ))}
            </ul>
          </div>
        </Seccion>

        <Seccion
          titulo="Motivo"
          descripcion="Marcas de una regla de altitud (una larga cada cinco), en bordes y divisores. Sobre Niebla va en gris; sobre Puna, en Ichu."
        >
          <div className="grid gap-6">
            <MarcasRegla className="text-input" />
            <div className="bg-puna">
              <MarcasRegla className="text-ichu" />
              <div className="p-5">
                <Logo tone="light" />
              </div>
            </div>
          </div>
        </Seccion>

        <Seccion
          titulo="Movimiento"
          descripcion="Tokens compartidos por Motion, GSAP, Lenis y las View Transitions (src/lib/motion/tokens.js ↔ --duracion-* / --curva-* de tokens.css). Con movimiento reducido la demo salta al final."
        >
          <DemoMovimiento />
        </Seccion>

        <Seccion
          titulo="Componentes"
          descripcion="El mismo muestrario con los tokens de la tienda (:root) y dentro de ThemeScope (clase .admin), en claro y oscuro. Los portales de Dialog, Drawer y Select heredan el tema."
        >
          <div className="grid gap-6">
            <div className="rounded-surface border bg-background p-5 sm:p-8">
              <p className="mb-6 text-sm font-semibold text-muted-foreground">Tienda</p>
              <Muestrario />
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              <ThemeScope theme="light" className="rounded-surface border p-5 sm:p-8">
                <p className="mb-6 text-sm font-semibold text-muted-foreground">Admin · claro</p>
                <Muestrario />
              </ThemeScope>
              <ThemeScope theme="dark" className="rounded-surface border p-5 sm:p-8">
                <p className="mb-6 text-sm font-semibold text-muted-foreground">Admin · oscuro</p>
                <Muestrario />
              </ThemeScope>
            </div>
          </div>
        </Seccion>
      </main>
    </div>
  );
}
