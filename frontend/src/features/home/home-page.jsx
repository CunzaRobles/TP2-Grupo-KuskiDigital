import { CategoriasAltitud } from './categorias-altitud';
import { Destacados } from './destacados';
import { Hero } from './hero';
import { Trazabilidad } from './trazabilidad';

// Home (estructura del wireframe): hero → categorías → destacados → trazabilidad.
// El header y el footer los pone TiendaLayout.
export function HomePage() {
  return (
    <>
      <Hero />
      <CategoriasAltitud />
      <Destacados />
      <Trazabilidad />
    </>
  );
}
