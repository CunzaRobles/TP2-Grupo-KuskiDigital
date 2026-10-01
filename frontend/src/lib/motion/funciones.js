// Funciones de Motion que se descargan después del primer pintado: las que LazyMotion inyecta en
// los componentes `m` (animaciones, gestos, layout) y el `animate` imperativo. El bundle inicial
// lleva solo los componentes `m`, que pintan su estado final mientras tanto.
export { animate as animar, domMax as default } from 'motion/react';
