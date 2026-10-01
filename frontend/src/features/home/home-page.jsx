import { lazy, Suspense } from 'react';
import { Destacados } from './destacados';
import { Hero } from './hero';
import { Trazabilidad } from './trazabilidad';

// El recorrido de categorías (con ScrollTrigger) queda bajo el pliegue: se descarga en paralelo
// y no retrasa el primer pintado del hero. Mientras llega, reserva una pantalla de alto.
const CategoriasAltitud = lazy(() =>
  import('./categorias-altitud').then((m) => ({ default: m.CategoriasAltitud })),
);

// Home (estructura del wireframe): hero → categorías → destacados → trazabilidad.
// El header y el footer los pone TiendaLayout.
export function HomePage() {
  return (
    <>
      <Hero />
      <Suspense fallback={<div aria-hidden="true" className="min-h-svh" />}>
        <CategoriasAltitud />
      </Suspense>
      <Destacados />
      <Trazabilidad />
    </>
  );
}
