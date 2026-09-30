// Animación del producto "volando" desde su tarjeta hasta el icono del carrito.
// Usa la Web Animations API sobre un clon fijo, así no altera el layout de la página.
// Con prefers-reduced-motion (o sin soporte) solo se omite el vuelo: el contador igual se actualiza.

const DURACION_MS = 650;
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

const reducirMovimiento = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function volarAlCarrito(origen, destino) {
  if (!origen || !destino || typeof origen.animate !== 'function' || reducirMovimiento()) return;

  const desde = origen.getBoundingClientRect();
  const hasta = destino.getBoundingClientRect();
  if (!desde.width || !hasta.width) return;

  const lado = Math.min(desde.width, desde.height);
  const clon = origen.cloneNode(false);
  clon.removeAttribute('class');
  Object.assign(clon.style, {
    position: 'fixed',
    left: `${desde.left + (desde.width - lado) / 2}px`,
    top: `${desde.top + (desde.height - lado) / 2}px`,
    width: `${lado}px`,
    height: `${lado}px`,
    margin: '0',
    objectFit: 'cover',
    borderRadius: '9999px',
    boxShadow: '0 18px 40px -12px rgb(43 29 20 / 0.35)',
    pointerEvents: 'none',
    zIndex: '60',
  });
  clon.removeAttribute('srcset');
  clon.setAttribute('aria-hidden', 'true');
  clon.alt = '';
  document.body.appendChild(clon);

  const dx = hasta.left + hasta.width / 2 - (desde.left + desde.width / 2);
  const dy = hasta.top + hasta.height / 2 - (desde.top + desde.height / 2);
  const escala = 28 / lado;

  // Trayectoria en arco: sube un poco a mitad de camino antes de caer en el icono
  const vuelo = clon.animate(
    [
      { transform: 'translate(0, 0) scale(0.9)', opacity: 1 },
      {
        transform: `translate(${dx * 0.55}px, ${dy * 0.35 - 60}px) scale(${Math.max(escala * 2.5, 0.35)})`,
        opacity: 0.95,
        offset: 0.55,
      },
      { transform: `translate(${dx}px, ${dy}px) scale(${escala})`, opacity: 0.4 },
    ],
    { duration: DURACION_MS, easing: EASE, fill: 'forwards' },
  );

  vuelo.onfinish = () => {
    clon.remove();
    destino.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }],
      { duration: 300, easing: EASE },
    );
  };
  vuelo.oncancel = () => clon.remove();
}
