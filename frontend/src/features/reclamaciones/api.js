import { useMutation } from '@tanstack/react-query';
import { http } from '@/lib/http';

// Registro público de una hoja del Libro de Reclamaciones (POST /reclamaciones, sin sesión).
export const useRegistrarReclamacion = () =>
  useMutation({ mutationFn: (hoja) => http.post('/reclamaciones', hoja) });
