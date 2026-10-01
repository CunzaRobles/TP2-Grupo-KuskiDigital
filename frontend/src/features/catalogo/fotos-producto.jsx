import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { imagenResponsive } from '@/lib/imagenes';
import { cn } from '@/lib/utils';

const IMAGEN =
  'absolute inset-0 size-full object-cover transition-opacity duration-300 ease-andino';

/**
 * Fotos de una tarjeta de producto: la principal (responsive, con `sizes`) y, si la tarjeta ya
 * recibió el puntero, la segunda. El cambio en hover solo ocurre cuando la segunda ya cargó,
 * para no pasar por un hueco vacío. `className` da el tamaño y la relación de aspecto.
 */
export function FotosProducto({ producto, imagenRef, sizes, segunda, className, style }) {
  const { t } = useTranslation();
  const [principal, secundaria] = producto.imagenes ?? [];
  const [segundaLista, setSegundaLista] = useState(false);
  const cambia = secundaria && segundaLista;

  return (
    <div className={cn('relative overflow-hidden bg-muted', className)} style={style}>
      {principal && (
        <img
          ref={imagenRef}
          {...imagenResponsive(principal.url)}
          sizes={sizes}
          alt={principal.textoAlt ?? producto.nombre}
          loading="lazy"
          decoding="async"
          className={cn(IMAGEN, cambia && 'group-hover:opacity-0')}
        />
      )}
      {secundaria && segunda && (
        <img
          {...imagenResponsive(secundaria.url)}
          sizes={sizes}
          alt=""
          aria-hidden="true"
          decoding="async"
          onLoad={() => setSegundaLista(true)}
          className={cn(IMAGEN, 'opacity-0', cambia && 'group-hover:opacity-100')}
        />
      )}
      {!producto.disponible && (
        <Badge variant="neutral" className="absolute top-3 left-3">
          {t('producto.agotado')}
        </Badge>
      )}
    </div>
  );
}
