import { useQueryClient } from '@tanstack/react-query';
import { useViewTransitionState } from 'react-router';
import { useCurrency } from '@/lib/currency';
import { NOMBRE_IMAGEN_PRODUCTO, useViewTransitionsActivas } from '@/lib/motion';
import { useNavigate } from '@/lib/motion/use-navigate';
import { productoQuery } from './api';

// Espera máxima de la ficha antes de navegar: si llega a tiempo, la foto se expande hasta la
// ficha ya pintada; si no, se navega igual (fundido normal y skeleton).
const ESPERA_MAXIMA_MS = 300;

const clicConModificador = (evento) =>
  evento.button !== 0 || evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey;

/**
 * Enlace de una tarjeta a la ficha del producto con el elemento compartido de la foto.
 * - Precarga la ficha con la intención del usuario (cursor encima o foco).
 * - Durante la View Transition hacia (o desde) la ficha, la foto de la tarjeta toma el nombre
 *   compartido con la foto principal de la ficha.
 * Con `compartida: false` (p. ej. relacionados dentro de otra ficha) solo precarga: así nunca hay
 * dos elementos con el mismo nombre en la página, que abortaría la transición.
 */
export function useEnlaceProducto(slug, { compartida = true } = {}) {
  const enlace = `/producto/${slug}`;
  const queryClient = useQueryClient();
  const { moneda } = useCurrency();
  const navigate = useNavigate();
  const activas = useViewTransitionsActivas();
  const transicionando = useViewTransitionState(enlace);

  const consulta = productoQuery(slug, moneda);
  const precargar = () => queryClient.prefetchQuery(consulta);

  const alHacerClic = (evento) => {
    if (!activas || !compartida || evento.defaultPrevented || clicConModificador(evento)) return;
    if (queryClient.getQueryData(consulta.queryKey)) return; // la ficha ya está: navega el Link

    evento.preventDefault();
    const tope = new Promise((resolver) => setTimeout(resolver, ESPERA_MAXIMA_MS));
    Promise.race([precargar(), tope]).finally(() => navigate(enlace));
  };

  return {
    enlace,
    nombreImagen: compartida && transicionando ? NOMBRE_IMAGEN_PRODUCTO : undefined,
    propsEnlace: { onPointerEnter: precargar, onFocus: precargar, onClick: alHacerClic },
  };
}
