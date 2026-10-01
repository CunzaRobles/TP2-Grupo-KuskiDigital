import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/lib/format';

const PASOS = ['cosecha', 'proceso', 'envio'];

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
      <h2 id="trayecto-titulo" className="max-w-2xl text-h2">
        {t('producto.trayecto.titulo')}
      </h2>

      {/* Tramos de una misma línea (como la regla del altímetro): cada paso cuelga de ella,
          alineado arriba y a la izquierda, con una marca Puna al inicio de su tramo. */}
      <ol className="grid gap-8 md:grid-cols-3 md:gap-0">
        {PASOS.map((id, i) => (
          <li
            key={id}
            className="relative grid content-start gap-2 border-t border-foreground/25 pt-5 md:pr-8"
          >
            <span aria-hidden="true" className="absolute -top-2 left-0 h-4 w-0.5 bg-puna" />
            <p className="text-sm text-muted-foreground tabular-nums">
              {t('producto.trayecto.paso', { n: i + 1 })}
            </p>
            <h3 className="text-h4">{t(`producto.trayecto.pasos.${id}`)}</h3>
            <p className="max-w-sm text-muted-foreground">
              {id === 'envio'
                ? t('producto.trayecto.envio')
                : t(`producto.trayecto.${grupo}.${id}`, valores)}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
