import { MapPin, ShieldCheck, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AndeanDivider } from '@/components/ui/andean-divider';

// Misma foto del hero (URL de Unsplash ya verificada), recortada en vertical.
const FOTO =
  'https://images.unsplash.com/photo-1531065208531-4036c0dba3ca?auto=format&fit=crop&w=1000&h=1400&q=75';

const VENTAJAS = [
  { icono: MapPin, clave: 'auth.ventajas.trazabilidad' },
  { icono: Truck, clave: 'auth.ventajas.seguimiento' },
  { icono: ShieldCheck, clave: 'auth.ventajas.pago' },
];

/**
 * Pantallas de acceso: en escritorio, foto andina con las ventajas de tener cuenta a la
 * izquierda y el formulario a la derecha; en móvil, solo el formulario.
 */
export function AuthLayout({ eyebrow, titulo, descripcion, children }) {
  const { t } = useTranslation();

  return (
    <div className="container-page grid items-stretch gap-10 py-10 sm:py-14 lg:grid-cols-2 lg:gap-16">
      <aside className="relative isolate hidden overflow-hidden rounded-2xl bg-puna text-white shadow-card lg:flex">
        <img
          src={FOTO}
          alt=""
          className="absolute inset-0 -z-20 size-full object-cover opacity-80"
          decoding="async"
        />
        <div
          className="absolute inset-0 -z-10 bg-linear-to-t from-puna via-puna/60 to-puna/10"
          aria-hidden="true"
        />
        <div className="mt-auto grid gap-6 p-10">
          <p className="max-w-sm font-heading text-h3 leading-tight">{t('auth.lema')}</p>
          <AndeanDivider className="w-40 text-ichu" />
          <ul className="grid gap-3 text-sm">
            {VENTAJAS.map(({ icono: Icono, clave }) => (
              <li key={clave} className="flex items-center gap-3">
                <Icono className="size-4 shrink-0 text-ichu" aria-hidden="true" />
                {t(clave)}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section className="mx-auto grid w-full max-w-md content-center gap-8 lg:py-10">
        <header className="grid gap-3">
          <p className="eyebrow text-link">{eyebrow}</p>
          <h1 className="text-h2">{titulo}</h1>
          {descripcion && <p className="text-muted-foreground">{descripcion}</p>}
        </header>
        {children}
      </section>
    </div>
  );
}
