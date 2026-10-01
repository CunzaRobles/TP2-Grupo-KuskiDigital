// Foto del hero (placeholder de Unsplash verificado): el valle del Urubamba con el pueblo al pie
// de los cerros, el punto de partida del recorrido. Módulo sin dependencias: vite.config.js lo
// importa para precargar la foto desde index.html cuando se entra por la Home.
export const FOTO_HERO = 'https://images.unsplash.com/photo-1665819922368-33dafd456067';
export const ANCHOS_HERO = [480, 768, 1080, 1440, 1920];
export const SIZES_HERO = '100vw';

export const srcHero = (ancho) => `${FOTO_HERO}?auto=format&fit=crop&w=${ancho}&q=70`;
export const srcSetHero = ANCHOS_HERO.map((a) => `${srcHero(a)} ${a}w`).join(', ');
