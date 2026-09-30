import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './http';

// No reintenta errores 4xx (validación, 401, 404): repetirlos no cambia el resultado.
export const debeReintentar = (intentos, error) => {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return intentos < 2;
};

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: debeReintentar,
      },
      mutations: {
        retry: false,
      },
    },
  });
