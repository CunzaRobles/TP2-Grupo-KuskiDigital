// Imágenes responsive. Las fotos de Unsplash (placeholders del catálogo) aceptan el ancho por
// parámetro: se genera un srcset para que cada pantalla descargue solo lo que muestra, con
// auto=format (WebP o AVIF según el navegador). Otras URLs (Supabase Storage) se usan tal cual.

export const ANCHOS_IMAGEN = [320, 480, 640, 960, 1280];

const esUnsplash = (url) => {
  try {
    return new URL(url).hostname === 'images.unsplash.com';
  } catch {
    return false;
  }
};

function conAncho(url, ancho, calidad) {
  const u = new URL(url);
  u.searchParams.set('auto', 'format');
  u.searchParams.set('fit', 'crop');
  u.searchParams.set('w', String(ancho));
  u.searchParams.set('q', String(calidad));
  u.searchParams.delete('h');
  return u.toString();
}

/**
 * Atributos `src` y `srcSet` para una foto. `sizes` lo decide quien la muestra.
 * imagenResponsive(url) → { src, srcSet } (o solo { src } si la URL no admite anchos).
 */
export function imagenResponsive(url, { anchos = ANCHOS_IMAGEN, calidad = 70 } = {}) {
  if (!url || !esUnsplash(url)) return { src: url };
  return {
    src: conAncho(url, anchos[Math.min(2, anchos.length - 1)], calidad),
    srcSet: anchos.map((a) => `${conAncho(url, a, calidad)} ${a}w`).join(', '),
  };
}
