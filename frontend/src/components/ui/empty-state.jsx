import { cn } from '@/lib/utils';

// Ilustraciones de los estados vacíos: cordillera con sol andino y un objeto en primer plano.
// Usan los tokens de la marca y se leen igual en cualquier tamaño.
const OBJETOS = {
  // Lupa sobre la cordillera: búsqueda sin resultados
  busqueda: (
    <g transform="translate(118 58)">
      <circle
        cx="20"
        cy="20"
        r="17"
        fill="var(--color-alpaca)"
        stroke="var(--color-cafe)"
        strokeWidth="5"
      />
      <path
        d="M12 20h16M20 12v16"
        stroke="var(--color-terracota)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.35"
      />
      <path d="M33 33l14 14" stroke="var(--color-cafe)" strokeWidth="7" strokeLinecap="round" />
    </g>
  ),
  // Canasta tejida vacía: carrito sin productos
  canasta: (
    <g transform="translate(106 70)">
      <path
        d="M14 20c0-14 12-22 22-22s22 8 22 22"
        fill="none"
        stroke="var(--color-cafe)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="M2 20h68l-8 34H10z" fill="var(--color-terracota)" />
      <path d="M8 30h56M11 40h50" stroke="var(--color-maiz)" strokeWidth="3" />
      <path
        d="M20 46l4-4 4 4 4-4 4 4 4-4 4 4 4-4 4 4"
        fill="none"
        stroke="var(--color-alpaca)"
        strokeWidth="2"
      />
    </g>
  ),
};

export function Ilustracion({ objeto, className = 'w-56 sm:w-64' }) {
  return (
    <svg viewBox="0 0 280 150" className={className} aria-hidden="true">
      <circle cx="198" cy="54" r="22" fill="var(--color-maiz)" opacity="0.85" />
      <path
        d="M0 128 62 58l34 36 42-54 58 68 30-30 54 50z"
        fill="var(--color-verde)"
        opacity="0.25"
      />
      <path
        d="M0 140 50 94l40 30 48-44 52 50 40-26 50 36z"
        fill="var(--color-verde)"
        opacity="0.45"
      />
      <path d="m138 40-12 14h24z" fill="var(--color-alpaca)" />
      <path d="M0 146h280" stroke="var(--color-cafe)" strokeWidth="2" opacity="0.2" />
      {OBJETOS[objeto]}
    </svg>
  );
}

/**
 * Estado vacío cuidado: ilustración, título, explicación y acción para salir del vacío.
 * `objeto`: 'busqueda' (sin resultados) | 'canasta' (carrito vacío).
 */
export function EmptyState({
  objeto = 'busqueda',
  titulo,
  descripcion,
  accion,
  headingLevel = 2,
  className,
}) {
  const Heading = `h${headingLevel}`;

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-5 rounded-surface border border-dashed bg-surface px-6 py-12 text-center sm:py-16',
        className,
      )}
    >
      <Ilustracion objeto={objeto} />
      <div className="grid max-w-md gap-2">
        <Heading className="text-h3">{titulo}</Heading>
        {descripcion && <p className="text-muted-foreground">{descripcion}</p>}
      </div>
      {accion}
    </div>
  );
}
