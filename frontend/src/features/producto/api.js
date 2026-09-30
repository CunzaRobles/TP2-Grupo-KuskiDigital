import { useQuery } from '@tanstack/react-query';
import { useCurrency } from '@/lib/currency';
import { http } from '@/lib/http';

export const productoKeys = {
  detalle: (slug, moneda) => ['productos', 'detalle', slug, { moneda }],
  relacionados: (slug, moneda, limit) => ['productos', 'relacionados', slug, { moneda, limit }],
};

// Ficha del producto con precios en la moneda elegida. Al cambiar la moneda se mantiene la
// ficha anterior mientras llega la nueva (solo si es el mismo producto).
export function useProducto(slug) {
  const { moneda } = useCurrency();
  return useQuery({
    queryKey: productoKeys.detalle(slug, moneda),
    queryFn: ({ signal }) => http.get(`/productos/${slug}`, { params: { moneda }, signal }),
    placeholderData: (anterior) => (anterior?.slug === slug ? anterior : undefined),
  });
}

export function useRelacionados(slug, { limit = 4 } = {}) {
  const { moneda } = useCurrency();
  return useQuery({
    queryKey: productoKeys.relacionados(slug, moneda, limit),
    queryFn: ({ signal }) =>
      http.get(`/productos/${slug}/relacionados`, { params: { moneda, limit }, signal }),
  });
}
