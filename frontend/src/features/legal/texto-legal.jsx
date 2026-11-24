import { Link } from '@/lib/motion/enlaces';

// **negrita** o [texto](destino). Solo se admiten rutas internas y mailto: (ver contenido/comun.js).
const MARCAS = /\*\*(.+?)\*\*|\[([^\]]+)\]\(((?:\/|mailto:)[^)\s]*)\)/g;

const CLASE_ENLACE =
  'font-semibold text-link underline decoration-1 underline-offset-4 hover:decoration-2';

/** Texto de un documento legal con su marcado mínimo convertido en elementos. */
export function TextoLegal({ texto }) {
  const partes = [];
  let desde = 0;

  for (const marca of texto.matchAll(MARCAS)) {
    const [completa, negrita, etiqueta, destino] = marca;
    if (marca.index > desde) partes.push(texto.slice(desde, marca.index));

    if (negrita) {
      partes.push(
        <strong key={marca.index} className="font-semibold">
          {negrita}
        </strong>,
      );
    } else if (destino.startsWith('/')) {
      partes.push(
        <Link key={marca.index} to={destino} className={CLASE_ENLACE}>
          {etiqueta}
        </Link>,
      );
    } else {
      partes.push(
        <a key={marca.index} href={destino} className={CLASE_ENLACE}>
          {etiqueta}
        </a>,
      );
    }
    desde = marca.index + completa.length;
  }

  if (desde < texto.length) partes.push(texto.slice(desde));
  return partes;
}
