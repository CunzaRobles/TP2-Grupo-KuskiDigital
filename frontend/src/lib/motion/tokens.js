// Tokens de movimiento compartidos por Motion, GSAP, Lenis y las View Transitions.
// Espejo de --duracion-* y --curva-* en styles/tokens.css (tokens.test.js comprueba que coincidan).

// Segundos (Motion y GSAP trabajan en segundos)
export const DURACION = { ruta: 0.18, rapida: 0.2, base: 0.3, lenta: 0.4 };

// Curvas cúbicas de Bézier: `salida` para respuestas a una acción (rápida al inicio, frena al
// llegar); `suave` para desplazamientos simétricos (el marcador del recorrido).
export const CURVA = {
  salida: [0.22, 1, 0.36, 1],
  suave: [0.65, 0, 0.35, 1],
};

// Compatibilidad: la curva de la marca se llamaba "andino" (también la utilidad ease-andino)
export const EASE_ANDINO = CURVA.salida;

export const cubicBezier = (curva) => `cubic-bezier(${curva.join(', ')})`;

export const milisegundos = (duracion) => Math.round(DURACION[duracion] * 1000);

// Transición de Motion con los tokens: transicion('rapida'), transicion('lenta', 'suave')
export const transicion = (duracion = 'base', curva = 'salida') => ({
  duration: DURACION[duracion],
  ease: CURVA[curva],
});
