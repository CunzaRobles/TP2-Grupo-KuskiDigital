import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/lib/http';

export const cuentaKeys = {
  direcciones: ['direcciones'],
  pedidos: (page) => ['pedidos', 'lista', { page }],
  pedido: (codigo) => ['pedidos', 'detalle', codigo],
};

// ── Direcciones ──

export const useDirecciones = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: cuentaKeys.direcciones,
    queryFn: ({ signal }) => http.get('/direcciones', { signal }),
    enabled,
  });

export function useGuardarDireccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos) => http.post('/direcciones', datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cuentaKeys.direcciones }),
  });
}

export function useMarcarPrincipal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => http.patch(`/direcciones/${id}`, { esPrincipal: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cuentaKeys.direcciones }),
  });
}

// DELETE devuelve las direcciones restantes (la principal pudo cambiar).
export function useEliminarDireccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => http.delete(`/direcciones/${id}`),
    onSuccess: (restantes) => queryClient.setQueryData(cuentaKeys.direcciones, restantes),
  });
}

// ── Pedidos ──

export const usePedidos = (page = 1) =>
  useQuery({
    queryKey: cuentaKeys.pedidos(page),
    queryFn: ({ signal }) => http.get('/pedidos', { params: { page, limit: 5 }, signal }),
    placeholderData: keepPreviousData,
  });

export const usePedido = (codigo) =>
  useQuery({
    queryKey: cuentaKeys.pedido(codigo),
    queryFn: ({ signal }) => http.get(`/pedidos/${codigo}`, { signal }),
  });
