import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { carritoKeys } from '@/features/carrito/carrito-context';
import { cuentaKeys } from '@/features/cuenta/api';
import { http } from '@/lib/http';

/**
 * Cotización del carrito del usuario: opciones de envío, IGV, tipo de cambio y total.
 * Se vuelve a pedir al cambiar el país, la moneda, el método o el contenido del carrito
 * (`firma`); mientras llega se mantiene la anterior para animar el cambio de montos.
 */
export function useCotizacion({ paisCodigo, moneda, metodoEnvio, firma }) {
  return useQuery({
    queryKey: ['checkout', 'cotizacion', { paisCodigo, moneda, metodoEnvio, firma }],
    queryFn: ({ signal }) =>
      http.post('/checkout/cotizar', { paisCodigo, moneda, metodoEnvio }, { signal }),
    enabled: Boolean(paisCodigo) && Boolean(firma),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

/**
 * Crea el pedido (POST /pedidos). La pasarela simulada tarda 1–2 s: la interfaz muestra
 * "procesando pago". Al aprobarse, el backend vacía el carrito.
 */
export function useCrearPedido() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos) => http.post('/pedidos', datos),
    onSuccess: (pedido) => {
      queryClient.setQueryData(cuentaKeys.pedido(pedido.codigo), pedido);
      queryClient.invalidateQueries({ queryKey: carritoKeys.servidorTodos });
      queryClient.invalidateQueries({ queryKey: ['pedidos', 'lista'] });
      queryClient.invalidateQueries({ queryKey: cuentaKeys.direcciones });
    },
    // Stock o precios cambiaron: el carrito mostrará los avisos actualizados.
    onError: (error) => {
      if (error?.code === 'STOCK_INSUFICIENTE' || error?.code === 'PRODUCTO_NO_ENCONTRADO') {
        queryClient.invalidateQueries({ queryKey: carritoKeys.servidorTodos });
      }
    },
  });
}
