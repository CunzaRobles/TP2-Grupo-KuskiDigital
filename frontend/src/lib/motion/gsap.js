import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CURVA } from './tokens';

// GSAP con los plugins que usa la tienda (todos gratuitos desde GSAP 3.13). Importar siempre
// desde aquí para que el registro ocurra una sola vez. SplitText está en ./split-text (aparte,
// para no sumarlo al bundle inicial).
gsap.registerPlugin(useGSAP, ScrollTrigger, CustomEase);

// Las curvas de los tokens, con nombre: gsap.to(el, { ease: 'salida' })
const aCustomEase = ([x1, y1, x2, y2]) => `M0,0 C${x1},${y1} ${x2},${y2} 1,1`;
for (const [nombre, curva] of Object.entries(CURVA)) CustomEase.create(nombre, aCustomEase(curva));

gsap.defaults({ ease: 'salida' });

// Animaciones no esenciales: solo se crean si el usuario no pidió movimiento reducido.
// conMovimiento((contexto) => { gsap.from(...) }) devuelve un gsap.matchMedia revertible.
export function conMovimiento(crear) {
  const media = gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)', crear);
  return media;
}

export { gsap, ScrollTrigger, useGSAP };
