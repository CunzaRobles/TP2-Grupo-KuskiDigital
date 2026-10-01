import { SplitText } from 'gsap/SplitText';
import { gsap } from './gsap';

// SplitText (gratuito desde GSAP 3.13) se registra aparte: solo entra al bundle de la página
// que lo importe. Con movimiento reducido no se debe partir el texto (usar conMovimiento).
gsap.registerPlugin(SplitText);

export { SplitText };
