import { useMutation } from '@tanstack/react-query';
import { http } from '@/lib/http';

// Asistente virtual: POST /chatbot/mensaje (público; con sesión puede informar los pedidos propios).
export const useMensajeChatbot = () =>
  useMutation({
    mutationFn: ({ mensaje, idioma }) => http.post('/chatbot/mensaje', { mensaje, idioma }),
  });
