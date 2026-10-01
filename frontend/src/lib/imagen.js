// Fotos responsivas. Los placeholders de Unsplash aceptan ?w=: en lugar de la foto de 1200 px
// guardada en la base, el navegador elige el ancho que su pantalla necesita (srcset + sizes) y
// auto=format la sirve en AVIF/WebP. Otras URLs (p. ej. Supabase Storage) se usan tal cual.
const ANCHOS = [160, 320, 480, 640, 960, 1280];
const MINIATURA = [80, 160, 240];

const conAncho = (url, ancho) => {
  const copia = new URL(url);
  copia.searchParams.set('w', ancho);
  copia.searchParams.set('auto', 'format');
  copia.searchParams.set('q', '75');
  return copia.href;
};

/**
 * Atributos src/srcSet/sizes para un <img>. `sizes` describe el ancho que ocupa la imagen en
 * la maqueta (p. ej. "(min-width: 1024px) 30vw, 50vw").
 */
export function imagenResponsiva(url, sizes, anchos = ANCHOS) {
  if (!url) return {};
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { src: url };
  }
  if (parsed.hostname !== 'images.unsplash.com') return { src: url };

  return {
    src: conAncho(parsed, anchos[Math.floor(anchos.length / 2)]),
    srcSet: anchos.map((ancho) => `${conAncho(parsed, ancho)} ${ancho}w`).join(', '),
    sizes,
  };
}

// Miniaturas (carrito, resumen, tablas): nunca más de 240 px.
export const miniatura = (url, ancho = 64) => imagenResponsiva(url, `${ancho}px`, MINIATURA);
