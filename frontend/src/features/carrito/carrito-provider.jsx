import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/ui/toast';
import { useSesion } from '@/features/auth/api';
import { useCurrency } from '@/lib/currency';
import { http } from '@/lib/http';
import { CarritoContext, carritoKeys } from './carrito-context';
import {
  carritoInvitado,
  carritoServidor,
  dtoAgregar,
  dtoCambiarCantidad,
  dtoQuitar,
} from './carrito-lineas';
import {
  CLAVE_CARRITO,
  aItemsApi,
  agregarItem,
  cambiarCantidadItem,
  guardarCarrito,
  leerCarrito,
  quitarItem,
  unidadesAgregables,
} from './carrito-storage';

/**
 * Carrito de la tienda.
 * - Invitado: vive en localStorage; los precios en la moneda elegida los da POST /carrito/invitado.
 * - Con sesión: vive en la API (/carrito). Los cambios se ven al instante (actualización
 *   optimista) y se confirman con la respuesta del servidor.
 * - Al iniciar sesión, el carrito de invitado se fusiona con el guardado (POST /carrito/fusionar).
 * `iconoCarritoRef` apunta al botón del header: destino de la animación "volar al carrito".
 */
export function CarritoProvider({ children }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { moneda } = useCurrency();
  const { data: usuario } = useSesion();
  const conSesion = Boolean(usuario);

  const [local, setLocal] = useState(leerCarrito);
  const localRef = useRef(local);
  const [abierto, setAbierto] = useState(false);
  const iconoCarritoRef = useRef(null);
  const pendientes = useRef(0);

  const actualizarLocal = useCallback((nuevos, persistir = true) => {
    localRef.current = nuevos;
    setLocal(nuevos);
    if (persistir) guardarCarrito(nuevos);
  }, []);

  // Mantiene sincronizadas las pestañas abiertas de la tienda
  useEffect(() => {
    const alCambiar = (evento) => {
      if (evento.key === CLAVE_CARRITO) actualizarLocal(leerCarrito(), false);
    };
    window.addEventListener('storage', alCambiar);
    return () => window.removeEventListener('storage', alCambiar);
  }, [actualizarLocal]);

  // ── Datos ──
  const servidor = useQuery({
    queryKey: carritoKeys.servidor(moneda),
    queryFn: ({ signal }) => http.get('/carrito', { params: { moneda }, signal }),
    enabled: conSesion,
    placeholderData: keepPreviousData,
  });

  const itemsInvitado = useMemo(() => aItemsApi(local), [local]);
  const precios = useQuery({
    queryKey: carritoKeys.invitado(moneda, itemsInvitado),
    queryFn: ({ signal }) =>
      http.post('/carrito/invitado', { items: itemsInvitado }, { params: { moneda }, signal }),
    enabled: !conSesion && itemsInvitado.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const carrito = useMemo(
    () =>
      conSesion
        ? carritoServidor(servidor.data)
        : carritoInvitado(local, precios.data, {
            vigente: precios.isSuccess && !precios.isPlaceholderData,
          }),
    [conSesion, servidor.data, local, precios.data, precios.isSuccess, precios.isPlaceholderData],
  );

  // ── Fusión del carrito de invitado al iniciar sesión ──
  // `fusionando` evita repetir la petición (StrictMode monta los efectos dos veces).
  const fusionando = useRef(null);
  const fusion = useMutation({
    mutationFn: ({ items, moneda: monedaPedida }) =>
      http.post('/carrito/fusionar', { items }, { params: { moneda: monedaPedida } }),
  });
  const alFusionar = useEffectEvent(async ({ carrito: dto, ajustes }, monedaPedida) => {
    // Un GET /carrito lanzado antes de la fusión no debe pisar el resultado
    await queryClient.cancelQueries({ queryKey: carritoKeys.servidorTodos });
    queryClient.setQueryData(carritoKeys.servidor(monedaPedida), dto);
    // Las copias en otras monedas quedaron viejas: se vuelven a pedir al usarlas
    queryClient.invalidateQueries({
      queryKey: carritoKeys.servidorTodos,
      predicate: ({ queryKey }) => queryKey[2]?.moneda !== monedaPedida,
      refetchType: 'none',
    });
    actualizarLocal([]);
    toast.success(t('carrito.fusionado'), {
      description: ajustes.length ? t('carrito.ajustado') : undefined,
    });
  });
  const alFallarFusion = useEffectEvent(() => {
    fusionando.current = null;
    toast.error(t('carrito.error'));
  });

  const fusionar = useEffectEvent((items) => {
    const monedaPedida = moneda;
    fusion.mutate(
      { items, moneda: monedaPedida },
      { onSuccess: (data) => alFusionar(data, monedaPedida), onError: alFallarFusion },
    );
  });

  const usuarioId = usuario?.id;
  useEffect(() => {
    const items = aItemsApi(localRef.current);
    if (!usuarioId || !items.length || fusionando.current === usuarioId) return;
    fusionando.current = usuarioId;
    fusionar(items);
  }, [usuarioId]);

  // ── Mutaciones con sesión: optimistas, se confirman con la última respuesta ──
  const mutarServidor = useCallback(
    async (optimista, peticion) => {
      const clave = carritoKeys.servidor(moneda);
      queryClient.cancelQueries({ queryKey: clave });
      queryClient.setQueryData(clave, (dto) => (dto ? optimista(dto) : dto));
      pendientes.current += 1;
      try {
        const dto = await peticion({ params: { moneda } });
        pendientes.current -= 1;
        if (pendientes.current === 0) queryClient.setQueryData(clave, dto);
      } catch (err) {
        pendientes.current -= 1;
        toast.error(
          t(err?.code === 'STOCK_INSUFICIENTE' ? 'carrito.sinMasStock' : 'carrito.error'),
        );
        queryClient.invalidateQueries({ queryKey: clave });
      }
    },
    [moneda, queryClient, t],
  );

  const lineaServidor = useCallback(
    (productoId) =>
      queryClient
        .getQueryData(carritoKeys.servidor(moneda))
        ?.items.find((l) => l.productoId === productoId),
    [moneda, queryClient],
  );

  /**
   * Agrega unidades sin superar el stock ni 99 por producto.
   * Devuelve (al instante) cuántas unidades se agregaron: 0 si no había más stock.
   */
  const agregar = useCallback(
    (producto, cantidad = 1) => {
      if (!conSesion) {
        const resultado = agregarItem(localRef.current, producto, cantidad);
        if (resultado.agregado > 0) actualizarLocal(resultado.items);
        return resultado.agregado;
      }

      const linea = lineaServidor(producto.id);
      const agregado = unidadesAgregables(
        linea?.cantidad ?? 0,
        linea?.producto.stock ?? producto.stock,
        cantidad,
      );
      if (agregado > 0) {
        mutarServidor(
          (dto) => dtoAgregar(dto, producto, agregado),
          (opciones) =>
            http.post('/carrito/items', { productoId: producto.id, cantidad: agregado }, opciones),
        );
      }
      return agregado;
    },
    [conSesion, actualizarLocal, lineaServidor, mutarServidor],
  );

  const cambiarCantidad = useCallback(
    (productoId, cantidad) => {
      if (!conSesion) {
        actualizarLocal(cambiarCantidadItem(localRef.current, productoId, cantidad));
        return;
      }
      const linea = lineaServidor(productoId);
      if (!linea?.id) return;
      mutarServidor(
        (dto) => dtoCambiarCantidad(dto, productoId, cantidad),
        (opciones) => http.patch(`/carrito/items/${linea.id}`, { cantidad }, opciones),
      );
    },
    [conSesion, actualizarLocal, lineaServidor, mutarServidor],
  );

  const quitar = useCallback(
    (productoId) => {
      if (!conSesion) {
        actualizarLocal(quitarItem(localRef.current, productoId));
        return;
      }
      const linea = lineaServidor(productoId);
      if (!linea?.id) return;
      mutarServidor(
        (dto) => dtoQuitar(dto, productoId),
        (opciones) => http.delete(`/carrito/items/${linea.id}`, opciones),
      );
    },
    [conSesion, actualizarLocal, lineaServidor, mutarServidor],
  );

  const consulta = conSesion ? servidor : precios;
  const hayLineas = carrito.lineas.length > 0;

  const value = useMemo(
    () => ({
      carrito,
      totalUnidades: carrito.totalUnidades,
      // Primera carga del carrito (con sesión) o de sus precios (invitado con productos)
      cargando: conSesion ? servidor.isPending : hayLineas && precios.isPending,
      // Fusionando el carrito de invitado tras iniciar sesión
      sincronizando: fusion.isPending,
      actualizando: consulta.isFetching,
      agregar,
      cambiarCantidad,
      quitar,
      cantidadEn: (productoId) =>
        carrito.lineas.find((l) => l.productoId === productoId)?.cantidad ?? 0,
      abierto,
      setAbierto,
      abrir: () => setAbierto(true),
      iconoCarritoRef,
    }),
    [
      carrito,
      conSesion,
      servidor.isPending,
      fusion.isPending,
      hayLineas,
      precios.isPending,
      consulta.isFetching,
      agregar,
      cambiarCantidad,
      quitar,
      abierto,
    ],
  );

  return <CarritoContext value={value}>{children}</CarritoContext>;
}
