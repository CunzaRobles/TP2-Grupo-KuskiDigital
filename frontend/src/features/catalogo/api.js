import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useCurrency } from '@/lib/currency';
import { http } from '@/lib/http';
import { aQueryApi } from './filtros';

// Consultas públicas del catálogo. Las que traen precios incluyen la moneda en la clave:
// al cambiarla, TanStack Query pide los montos ya convertidos por el backend.
export const catalogoKeys = {
  destacados: (moneda, limit) => ['productos', 'destacados', { moneda, limit }],
  lista: (query) => ['productos', 'lista', query],
  categorias: ['categorias'],
  comunidades: ['comunidades'],
  certificaciones: ['certificaciones'],
  trazabilidad: ['estadisticas', 'trazabilidad'],
};

export function useDestacados({ limit = 8 } = {}) {
  const { moneda } = useCurrency();
  return useQuery({
    queryKey: catalogoKeys.destacados(moneda, limit),
    queryFn: ({ signal }) =>
      http.get('/productos/destacados', { params: { moneda, limit }, signal }),
    placeholderData: (anterior) => anterior,
  });
}

// Página del catálogo. Mientras llega la nueva página se sigue mostrando la anterior
// (isPlaceholderData), así la grilla no parpadea al cambiar un filtro.
export function useProductos(filtros) {
  const { moneda } = useCurrency();
  const query = aQueryApi(filtros, moneda);
  return useQuery({
    queryKey: catalogoKeys.lista(query),
    queryFn: ({ signal }) => http.get('/productos', { params: query, signal }),
    placeholderData: keepPreviousData,
  });
}

export const useCategorias = () =>
  useQuery({
    queryKey: catalogoKeys.categorias,
    queryFn: ({ signal }) => http.get('/categorias', { signal }),
    staleTime: 10 * 60_000,
  });

export const useComunidades = () =>
  useQuery({
    queryKey: catalogoKeys.comunidades,
    queryFn: ({ signal }) => http.get('/comunidades', { signal }),
    staleTime: 10 * 60_000,
  });

export const useTrazabilidad = () =>
  useQuery({
    queryKey: catalogoKeys.trazabilidad,
    queryFn: ({ signal }) => http.get('/estadisticas/trazabilidad', { signal }),
    staleTime: 10 * 60_000,
  });

export const useCertificaciones = () =>
  useQuery({
    queryKey: catalogoKeys.certificaciones,
    queryFn: ({ signal }) => http.get('/certificaciones', { signal }),
    staleTime: 10 * 60_000,
  });
