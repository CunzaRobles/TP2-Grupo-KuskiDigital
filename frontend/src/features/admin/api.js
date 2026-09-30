import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/lib/http';

// Consultas y mutaciones del panel admin (/api/v1/admin). Todas en soles (PEN).
export const adminKeys = {
  todo: ['admin'],
  dashboard: ['admin', 'dashboard'],
  estadisticas: ['admin', 'estadisticas'],
  ventas: (query) => ['admin', 'ventas', query],
  pedidos: (query) => ['admin', 'pedidos', 'lista', query],
  pedido: (codigo) => ['admin', 'pedidos', 'detalle', codigo],
  productos: (query) => ['admin', 'productos', 'lista', query],
  producto: (id) => ['admin', 'productos', 'detalle', id],
  inventario: (query) => ['admin', 'inventario', query],
  kardex: (id, page) => ['admin', 'kardex', id, page],
  categorias: ['admin', 'categorias'],
  usuarios: (query) => ['admin', 'usuarios', query],
  buscar: (q) => ['admin', 'buscar', q],
};

const lista = (queryKey, path, params) => ({
  queryKey,
  queryFn: ({ signal }) => http.get(path, { params, signal }),
  placeholderData: keepPreviousData,
});

export const useDashboard = () =>
  useQuery({
    queryKey: adminKeys.dashboard,
    queryFn: ({ signal }) => http.get('/admin/dashboard', { signal }),
  });

export const useEstadisticas = () =>
  useQuery({
    queryKey: adminKeys.estadisticas,
    queryFn: ({ signal }) => http.get('/admin/estadisticas', { signal }),
  });

export const useVentas = (query) =>
  useQuery(lista(adminKeys.ventas(query), '/admin/ventas', query));

export const usePedidosAdmin = (query) =>
  useQuery(lista(adminKeys.pedidos(query), '/admin/pedidos', query));

export const usePedidoAdmin = (codigo) =>
  useQuery({
    queryKey: adminKeys.pedido(codigo),
    queryFn: ({ signal }) => http.get(`/admin/pedidos/${codigo}`, { signal }),
    enabled: Boolean(codigo),
  });

export function useCambiarEstado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ codigo, estado, comentario }) =>
      http.patch(`/admin/pedidos/${codigo}/estado`, {
        estado,
        comentario: comentario || undefined,
      }),
    onSuccess: (pedido) => {
      queryClient.setQueryData(adminKeys.pedido(pedido.codigo), pedido);
      // Cambia listas, KPIs e inventario (una cancelación devuelve stock).
      queryClient.invalidateQueries({ queryKey: adminKeys.todo });
    },
  });
}

export const useProductosAdmin = (query) =>
  useQuery(lista(adminKeys.productos(query), '/admin/productos', query));

export const useProductoAdmin = (id) =>
  useQuery({
    queryKey: adminKeys.producto(id),
    queryFn: ({ signal }) => http.get(`/admin/productos/${id}`, { signal }),
    enabled: Boolean(id),
  });

// Crear (sin id) o actualizar (con id) un producto.
export function useGuardarProducto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }) =>
      id ? http.put(`/admin/productos/${id}`, datos) : http.post('/admin/productos', datos),
    onSuccess: (producto) => {
      queryClient.setQueryData(adminKeys.producto(producto.id), producto);
      queryClient.invalidateQueries({ queryKey: adminKeys.todo });
      // La tienda debe ver el cambio (precio, nombre, destacado...).
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
  });
}

export function useDesactivarProducto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => http.delete(`/admin/productos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.todo });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
  });
}

// Imágenes: cada operación devuelve el estado final y refresca la ficha del producto.
function useMutacionImagen(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (_datos, { productoId }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.producto(productoId) });
      queryClient.invalidateQueries({ queryKey: ['admin', 'productos', 'lista'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
  });
}

export const useSubirImagen = () =>
  useMutacionImagen(({ productoId, archivo, textoAlt }) => {
    const datos = new FormData();
    datos.append('imagen', archivo);
    if (textoAlt) datos.append('textoAlt', textoAlt);
    return http.post(`/admin/productos/${productoId}/imagenes`, datos);
  });

export const useActualizarImagen = () =>
  useMutacionImagen(({ productoId, imagenId, cambios }) =>
    http.patch(`/admin/productos/${productoId}/imagenes/${imagenId}`, cambios),
  );

export const useEliminarImagen = () =>
  useMutacionImagen(({ productoId, imagenId }) =>
    http.delete(`/admin/productos/${productoId}/imagenes/${imagenId}`),
  );

export const useInventario = (query) =>
  useQuery(lista(adminKeys.inventario(query), '/admin/inventario', query));

export const useKardex = (productoId, page = 1) =>
  useQuery({
    queryKey: adminKeys.kardex(productoId, page),
    queryFn: ({ signal }) =>
      http.get(`/admin/inventario/${productoId}/movimientos`, { params: { page }, signal }),
    enabled: Boolean(productoId),
    placeholderData: keepPreviousData,
  });

export function useRegistrarMovimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (movimiento) => http.post('/admin/inventario/movimientos', movimiento),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.todo });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
    },
  });
}

export const useCategoriasAdmin = () =>
  useQuery({
    queryKey: adminKeys.categorias,
    queryFn: ({ signal }) => http.get('/admin/categorias', { signal }),
  });

export function useGuardarCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }) =>
      id ? http.put(`/admin/categorias/${id}`, datos) : http.post('/admin/categorias', datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.categorias });
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
    },
  });
}

export function useEliminarCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => http.delete(`/admin/categorias/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.categorias });
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
    },
  });
}

export const useUsuariosAdmin = (query) =>
  useQuery(lista(adminKeys.usuarios(query), '/admin/usuarios', query));

export function useGuardarUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }) =>
      id ? http.patch(`/admin/usuarios/${id}`, datos) : http.post('/admin/usuarios', datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] }),
  });
}

export const useBusquedaAdmin = (q) =>
  useQuery({
    queryKey: adminKeys.buscar(q),
    queryFn: ({ signal }) => http.get('/admin/buscar', { params: { q }, signal }),
    enabled: q.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
