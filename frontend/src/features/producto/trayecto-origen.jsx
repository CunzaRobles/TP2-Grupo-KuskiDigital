import { Hand, Plane, Sprout } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/lib/format';
import { EASE_ANDINO } from '@/lib/motion';

const PASOS = [
  { id: 'cosecha', icono: Sprout },
  { id: 'proceso', icono: Hand },
  { id: 'envio', icono: Plane },
];

const CATEGORIAS_CON_TEXTO = ['cafe', 'superalimentos', 'textiles', 'artesania'];

/**
 * Línea de tiempo del origen: cosecha → proceso → envío. Los textos dependen de la categoría
 * e incluyen la comunidad y la altitud reales del producto.
 */
export function TrayectoOrigen({ producto }) {
  const { t, i18n } = useTranslation();
  const slug = producto.categoria?.slug;
  const grupo = CATEGORIAS_CON_TEXTO.includes(slug) ? slug : 'general';
  const comunidad = producto.comunidad;
  const valores = {
    comunidad: comunidad?.nombre ?? 'Kuski',
    altitud: comunidad?.altitudMsnm
      ? t('producto.altitud', { valor: formatNumber(comunidad.altitudMsnm, i18n.resolvedLanguage) })
      : '',
  };

  return (
    <section aria-labelledby="trayecto-titulo" className="grid gap-10">
      <div className="grid max-w-2xl gap-3">
        <p className="eyebrow text-link">{t('producto.trayecto.eyebrow')}</p>
        <h2 id="trayecto-titulo" className="text-h2">
          {t('producto.trayecto.titulo')}
        </h2>
      </div>

      <ol className="relative grid gap-10 md:grid-cols-3 md:gap-8">
        {/* Hilo que une los pasos: vertical en móvil, horizontal en escritorio */}
        <span
          aria-hidden="true"
          className="absolute top-6 bottom-6 left-6 w-px bg-linear-to-b from-terracota via-maiz to-verde md:top-6 md:right-[16.66%] md:bottom-auto md:left-[16.66%] md:h-px md:w-auto md:bg-linear-to-r"
        />
        {PASOS.map(({ id, icono: Icono }, i) => (
          <motion.li
            key={id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, ease: EASE_ANDINO, delay: i * 0.12 }}
            className="relative grid grid-cols-[3rem_1fr] gap-5 md:grid-cols-1 md:justify-items-center md:text-center"
          >
            <span className="relative z-10 flex size-12 items-center justify-center rounded-full border-4 border-background bg-cafe text-maiz shadow-card">
              <Icono className="size-5" aria-hidden="true" />
            </span>
            <div className="grid gap-2">
              <p className="eyebrow text-muted-foreground">
                {t('producto.trayecto.paso', { n: i + 1 })}
              </p>
              <h3 className="text-h4">{t(`producto.trayecto.pasos.${id}`)}</h3>
              <p className="max-w-xs text-muted-foreground">
                {id === 'envio'
                  ? t('producto.trayecto.envio')
                  : t(`producto.trayecto.${grupo}.${id}`, valores)}
              </p>
            </div>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
