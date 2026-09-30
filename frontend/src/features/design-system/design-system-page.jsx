import { useTranslation } from 'react-i18next';
import { CurrencySelect, LanguageSelect } from '@/components/layout/preference-selects';
import { Logo } from '@/components/layout/logo';
import { AndeanDivider } from '@/components/ui/andean-divider';
import { ThemeScope } from '@/components/ui/theme-scope';
import { contrastRatio } from '@/lib/contrast';
import { Muestrario } from './muestrario';

// Solo desarrollo (ver app/router.jsx). Referencia visual del design system "editorial andino".

const PALETA = [
  { nombre: 'Café profundo', token: 'cafe', hex: '#2B1D14', texto: '#FBF9F5' },
  { nombre: 'Terracota / achiote', token: 'terracota', hex: '#B5532C', texto: '#FBF9F5' },
  { nombre: 'Dorado maíz', token: 'maiz', hex: '#D9A441', texto: '#2B1D14' },
  { nombre: 'Crema quinua', token: 'crema', hex: '#F5EFE4', texto: '#2B1D14' },
  { nombre: 'Blanco alpaca', token: 'alpaca', hex: '#FBF9F5', texto: '#2B1D14' },
  { nombre: 'Verde andino', token: 'verde', hex: '#4F6B4A', texto: '#FBF9F5' },
  { nombre: 'Terracota 700 (texto)', token: 'terracota-700', hex: '#9A4322', texto: '#FBF9F5' },
  { nombre: 'Tierra 600 (secundario)', token: 'tierra-600', hex: '#6B5848', texto: '#FBF9F5' },
];

const ESCALA = [
  { clase: 'text-display', muestra: 'Café de altura', meta: 'Display · Fraunces' },
  { clase: 'text-h1', muestra: 'Textiles de alpaca', meta: 'H1 · Fraunces' },
  { clase: 'text-h2', muestra: 'Comunidades de Cusco', meta: 'H2 · Fraunces' },
  { clase: 'text-h3', muestra: 'Quinua roja de Anta', meta: 'H3 · Fraunces' },
  { clase: 'text-h4', muestra: 'Origen y trazabilidad', meta: 'H4 · Fraunces' },
  {
    clase: 'text-lead font-sans',
    muestra: 'Cosechado a 3 400 msnm por la comunidad de Chinchero.',
    meta: 'Lead · Manrope',
  },
  {
    clase: 'text-base font-sans',
    muestra: 'Texto base para descripciones de producto, legible y cálido.',
    meta: 'Base · Manrope 16px',
  },
  { clase: 'eyebrow text-link', muestra: 'Cusco · Valle Sagrado', meta: 'Eyebrow · Manrope' },
];

const RADIOS = [
  'rounded-sm',
  'rounded-md',
  'rounded-lg',
  'rounded-xl',
  'rounded-2xl',
  'rounded-full',
];
const SOMBRAS = ['shadow-soft', 'shadow-card', 'shadow-lift'];

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

export function DesignSystemPage() {
  const { i18n } = useTranslation();

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md">
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
          <p className="eyebrow text-link">Kuski Digital</p>
          <h1 className="text-h1">Editorial andino</h1>
          <p className="text-lead text-muted-foreground">
            Tokens y componentes base. Idioma activo: <strong>{i18n.resolvedLanguage}</strong>.
            Cambia idioma y moneda arriba para ver Price, Stepper y los textos de accesibilidad.
          </p>
        </div>

        <Seccion
          titulo="Paleta"
          descripcion="Valores exactos de CLAUDE.md más dos variantes derivadas para texto. Ratio contra blanco alpaca y crema quinua (AA texto ≥ 4.5)."
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {PALETA.map((c) => (
              <figure
                key={c.token}
                className="overflow-hidden rounded-xl border bg-card shadow-soft"
              >
                <div
                  className="flex h-24 items-end p-3 text-xs font-bold"
                  style={{ background: c.hex, color: c.texto }}
                >
                  Aa
                </div>
                <figcaption className="grid gap-0.5 p-3 text-xs">
                  <span className="font-semibold text-foreground">{c.nombre}</span>
                  <code className="text-muted-foreground">
                    {c.hex} · {c.token}
                  </code>
                  <span className="text-muted-foreground tabular-nums">
                    alpaca {contrastRatio(c.hex, '#FBF9F5').toFixed(2)} · crema{' '}
                    {contrastRatio(c.hex, '#F5EFE4').toFixed(2)}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </Seccion>

        <Seccion
          titulo="Tipografía"
          descripcion="Fraunces para títulos (serif óptica) y Manrope para texto. Escala fluida con clamp()."
        >
          <div className="grid gap-5 rounded-2xl border bg-card p-6 sm:p-10">
            {ESCALA.map((e) => (
              <div
                key={e.meta}
                className="grid gap-1 border-b pb-5 last:border-0 last:pb-0 md:grid-cols-[12rem_1fr] md:items-baseline md:gap-6"
              >
                <code className="text-xs text-muted-foreground">{e.meta}</code>
                <p className={e.clase}>{e.muestra}</p>
              </div>
            ))}
          </div>
        </Seccion>

        <Seccion titulo="Radios, sombras y motivo">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="flex flex-wrap gap-4">
              {RADIOS.map((r) => (
                <div key={r} className="grid justify-items-center gap-2">
                  <div className={`size-16 border-2 border-primary bg-secondary ${r}`} />
                  <code className="text-xs text-muted-foreground">{r}</code>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-6">
              {SOMBRAS.map((s) => (
                <div
                  key={s}
                  className={`grid size-28 place-content-center rounded-xl bg-card ${s}`}
                >
                  <code className="text-xs text-muted-foreground">{s}</code>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-6">
            <AndeanDivider />
            <AndeanDivider variant="ornament" />
          </div>
        </Seccion>

        <Seccion
          titulo="Componentes"
          descripcion="Mismo muestrario en la tienda (claro) y en el admin (oscuro, el único contexto con modo oscuro). Los portales de Dialog, Drawer y Select heredan el tema."
        >
          <div className="grid gap-6 xl:grid-cols-2">
            <ThemeScope theme="light" className="rounded-2xl border p-5 sm:p-8">
              <p className="eyebrow mb-6 text-muted-foreground">Claro · tienda</p>
              <Muestrario />
            </ThemeScope>
            <ThemeScope theme="dark" className="rounded-2xl border p-5 sm:p-8">
              <p className="eyebrow mb-6 text-muted-foreground">Oscuro · admin</p>
              <Muestrario />
            </ThemeScope>
          </div>
        </Seccion>
      </main>
    </div>
  );
}
