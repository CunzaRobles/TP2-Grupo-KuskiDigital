// Tokens de movimiento (espejo de --ease-andino en styles/tokens.css). Duraciones de 200 a 400 ms.
// prefers-reduced-motion se respeta globalmente con <MotionConfig reducedMotion="user">.
export const EASE_ANDINO = [0.22, 1, 0.36, 1];

export const DURACION = { rapida: 0.2, base: 0.3, lenta: 0.4 };

export const transicion = (duracion = 'base') => ({
  duration: DURACION[duracion],
  ease: EASE_ANDINO,
});
