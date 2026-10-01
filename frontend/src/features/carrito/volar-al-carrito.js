// Animación del producto "volando" desde su tarjeta hasta el icono del carrito, en arco, y el
// rebote del contador al llegar. Usa la Web Animations API sobre un clon fijo, así no altera el
// layout de la página. Con prefers-reduced-motion (o sin soporte) no hay vuelo ni rebote: el
// contador igual se actualiza.
import { CURVA, cubicBezier } from '@/lib/motion/tokens';

const DURACION_MS = 650;
const REBOTE_MS = 420;
const MUESTRAS = 16;
const LADO_FINAL = 24;

const reducirMovimiento = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Punto de una curva cuadrática de Bézier (inicio en 0,0; control `c`; fin `f`).
const bezier = (t, c, f) => 2 * (1 - t) * t * c + t * t * f;

// Pequeño rebote del contador del carrito (el punto Cochinilla sobre el icono).
export function rebotarContador(destino) {
  if (!destino || reducirMovimiento()) return;
  const contador = destino.querySelector('[data-slot="contador-carrito"]');
  if (typeof contador?.animate !== 'function') return;
  contador.animate(
    [
      { transform: 'scale(1)' },
      { transform: 'scale(1.3)', offset: 0.35 },
      { transform: 'scale(0.92)', offset: 0.7 },
      { transform: 'scale(1)' },
    ],
    { duration: REBOTE_MS, easing: 'ease-out' },
  );
}

export function volarAlCarrito(origen, destino) {
  if (!destino || reducirMovimiento()) return;
  if (!origen || typeof origen.animate !== 'function') {
    rebotarContador(destino);
    return;
  }

  const desde = origen.getBoundingClientRect();
  const hasta = destino.getBoundingClientRect();
  if (!desde.width || !hasta.width) {
    rebotarContador(destino);
    return;
  }

  const lado = Math.min(desde.width, desde.height, 160);
  const clon = origen.cloneNode(false);
  clon.removeAttribute('class');
  clon.removeAttribute('srcset');
  Object.assign(clon.style, {
    position: 'fixed',
    left: `${desde.left + (desde.width - lado) / 2}px`,
    top: `${desde.top + (desde.height - lado) / 2}px`,
    width: `${lado}px`,
    height: `${lado}px`,
    margin: '0',
    objectFit: 'cover',
    borderRadius: '9999px',
    // Lo único que flota sobre la página mientras viaja
    boxShadow: '0 12px 28px -12px rgb(27 36 64 / 0.4)',
    pointerEvents: 'none',
    zIndex: '60',
  });
  clon.setAttribute('aria-hidden', 'true');
  clon.alt = '';
  document.body.appendChild(clon);

  const dx = hasta.left + hasta.width / 2 - (desde.left + desde.width / 2);
  const dy = hasta.top + hasta.height / 2 - (desde.top + desde.height / 2);
  const escalaFinal = LADO_FINAL / lado;
  // Punto de control del arco: a mitad de camino en x y por encima del punto más alto
  const control = { x: dx * 0.5, y: Math.min(0, dy) - Math.max(80, Math.abs(dx) * 0.25) };

  const fotogramas = Array.from({ length: MUESTRAS + 1 }, (_, i) => {
    const t = i / MUESTRAS;
    const x = bezier(t, control.x, dx);
    const y = bezier(t, control.y, dy);
    const escala = 1 + (escalaFinal - 1) * t;
    return { transform: `translate(${x}px, ${y}px) scale(${escala})`, opacity: t < 0.85 ? 1 : 0.6 };
  });

  const vuelo = clon.animate(fotogramas, {
    duration: DURACION_MS,
    easing: cubicBezier(CURVA.suave),
    fill: 'forwards',
  });

  vuelo.onfinish = () => {
    clon.remove();
    rebotarContador(destino);
  };
  vuelo.oncancel = () => clon.remove();
}
