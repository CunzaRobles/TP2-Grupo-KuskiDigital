// Enlace extendido de las tarjetas de producto: su ::after cubre toda la tarjeta (el botón "+"
// queda encima con z-10). Con teclado, el foco se dibuja en ese ::after, así se ve la tarjeta
// completa enmarcada y no solo el nombre.
export const ENLACE_EXTENDIDO =
  "after:absolute after:inset-0 after:content-[''] focus-visible:outline-hidden focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring";
