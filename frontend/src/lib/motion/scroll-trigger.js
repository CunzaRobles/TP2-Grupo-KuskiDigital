import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { gsap } from './gsap';
import { alHacerScrollLenis } from './lenis-context';

// ScrollTrigger (recorrido de categorías de la Home). Va en el chunk de esa sección, que se
// carga después del primer pintado.
gsap.registerPlugin(ScrollTrigger);

// Con Lenis activo, cada frame de su scroll actualiza los triggers (sin desfase con el pin).
alHacerScrollLenis(ScrollTrigger.update);

export { ScrollTrigger };
