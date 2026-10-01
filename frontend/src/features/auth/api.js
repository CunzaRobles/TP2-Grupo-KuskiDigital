import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, http } from '@/lib/http';

export const authKeys = { sesion: ['auth', 'sesion'] };

// Usuario de la sesión actual (cookie httpOnly) o null si navega como invitado.
// Login, registro y logout actualizan authKeys.sesion: el resto de la tienda (p. ej. el
// carrito, que fusiona el de invitado al detectar la sesión) reacciona a ese cambio.
export const useSesion = () =>
  useQuery({
    queryKey: authKeys.sesion,
    queryFn: async ({ signal }) => {
      try {
        const data = await http.get('/auth/sesion', { signal });
        return data?.usuario ?? null;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  });

// Al iniciar o cerrar sesión se descartan los datos privados del usuario anterior.
const DATOS_PRIVADOS = [
  ['carrito', 'servidor'],
  ['pedidos'],
  ['direcciones'],
  ['checkout'],
  ['admin'],
];

const usarSesion = (queryClient, usuario) => {
  for (const queryKey of DATOS_PRIVADOS) queryClient.removeQueries({ queryKey });
  queryClient.setQueryData(authKeys.sesion, usuario);
};

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credenciales) => http.post('/auth/login', credenciales),
    onSuccess: ({ usuario }) => usarSesion(queryClient, usuario),
  });
}

export function useRegistro() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos) => http.post('/auth/registro', datos),
    onSuccess: ({ usuario }) => usarSesion(queryClient, usuario),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => http.post('/auth/logout'),
    onSettled: () => usarSesion(queryClient, null),
  });
}
