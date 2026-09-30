import { Lock, MapPin, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { AndeanDivider } from '@/components/ui/andean-divider';
import { Logo } from './logo';

// Columnas de enlaces del footer. Las rutas se completan en las fases siguientes.
const COLUMNAS = [
  {
    clave: 'tienda',
    enlaces: [
      { to: '/catalogo', clave: 'footer.enlaces.catalogo' },
      { to: '/catalogo?categoria=cafe', clave: 'catalogo.categorias.cafe.nombre' },
      {
        to: '/catalogo?categoria=superalimentos',
        clave: 'catalogo.categorias.superalimentos.nombre',
      },
      { to: '/catalogo?categoria=textiles', clave: 'catalogo.categorias.textiles.nombre' },
      { to: '/catalogo?categoria=artesania', clave: 'catalogo.categorias.artesania.nombre' },
    ],
  },
  {
    clave: 'ayuda',
    enlaces: [
      { to: '/envios', clave: 'footer.enlaces.envios' },
      { to: '/cuenta/pedidos', clave: 'footer.enlaces.seguimiento' },
      { to: '/ayuda', clave: 'footer.enlaces.preguntas' },
      { to: '/contacto', clave: 'footer.enlaces.contacto' },
    ],
  },
  {
    clave: 'empresa',
    enlaces: [
      { to: '/nosotros', clave: 'nav.nosotros' },
      { to: '/origen', clave: 'footer.enlaces.origen' },
      { to: '/terminos', clave: 'footer.enlaces.terminos' },
      { to: '/privacidad', clave: 'footer.enlaces.privacidad' },
      { to: '/admin/login', clave: 'footer.enlaces.equipo' },
    ],
  },
];

// Glifos de redes (lucide ya no incluye logotipos de marcas).
const REDES = [
  {
    nombre: 'Instagram',
    href: 'https://instagram.com',
    icono: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
      </>
    ),
  },
  {
    nombre: 'Facebook',
    href: 'https://facebook.com',
    icono: (
      <path d="M15 3h-2.5A4.5 4.5 0 0 0 8 7.5V10H5.5v4H8v7h4v-7h3l.5-4H12V7.8c0-.5.3-.8.8-.8H15z" />
    ),
  },
  {
    nombre: 'YouTube',
    href: 'https://youtube.com',
    icono: (
      <>
        <rect x="2.5" y="5" width="19" height="14" rx="4" />
        <path d="M10 9.2v5.6l4.8-2.8z" fill="currentColor" />
      </>
    ),
  },
];

const METODOS_PAGO = ['Visa', 'Mastercard', 'PayPal', 'Yape', 'Plin'];

export function SiteFooter() {
  const { t } = useTranslation();

  return (
    <footer className="bg-cafe text-crema">
      <AndeanDivider className="text-maiz" />

      <div className="container-page grid gap-12 py-16 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
        <div className="grid content-start gap-6">
          <Logo tone="light" />
          <p className="max-w-sm text-crema/75">{t('footer.descripcion')}</p>
          <p className="flex items-center gap-2 text-sm text-crema/75">
            <MapPin className="size-4 text-maiz" aria-hidden="true" />
            {t('footer.ubicacion')}
          </p>
          <div className="grid gap-3">
            <p className="eyebrow text-maiz">{t('footer.redes')}</p>
            <ul className="flex gap-2">
              {REDES.map(({ nombre, href, icono }) => (
                <li key={nombre}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={nombre}
                    className="inline-flex size-10 items-center justify-center rounded-full border border-crema/25 transition duration-200 ease-andino hover:border-maiz hover:bg-maiz hover:text-cafe"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="size-4.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      {icono}
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          {COLUMNAS.map(({ clave, enlaces }) => (
            <nav
              key={clave}
              aria-labelledby={`footer-${clave}`}
              className="grid content-start gap-4"
            >
              <p id={`footer-${clave}`} className="eyebrow text-maiz">
                {t(`footer.columnas.${clave}`)}
              </p>
              <ul className="grid gap-2.5">
                {enlaces.map(({ to, clave: texto }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-sm text-crema/80 transition-colors hover:text-alpaca hover:underline hover:underline-offset-4"
                    >
                      {t(texto)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="border-t border-crema/15">
        <div className="container-page flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-crema/70">
            {t('footer.derechos', { year: new Date().getFullYear() })}
          </p>

          {/* Sello de pago seguro (la pasarela es simulada; ver backend/src/adapters/payments) */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <p className="flex items-center gap-2.5">
              <span className="inline-flex size-9 items-center justify-center rounded-full bg-verde text-alpaca">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <span className="grid text-sm leading-tight">
                <span className="font-semibold text-alpaca">{t('footer.pagoSeguro')}</span>
                <span className="flex items-center gap-1 text-xs text-crema/70">
                  <Lock className="size-3" aria-hidden="true" />
                  {t('footer.pagoSeguroDetalle')}
                </span>
              </span>
            </p>
            <ul aria-label={t('footer.metodosPago')} className="flex flex-wrap gap-1.5">
              {METODOS_PAGO.map((metodo) => (
                <li
                  key={metodo}
                  className="rounded-md border border-crema/20 bg-crema/5 px-2 py-1 text-xs font-bold tracking-wide text-crema/85"
                >
                  {metodo}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
