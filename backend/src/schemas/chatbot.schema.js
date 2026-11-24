import { z } from 'zod';

// Mensaje del asistente virtual: texto libre corto y el idioma activo de la interfaz.
export const mensajeChatbotBody = z.object({
  mensaje: z.string().trim().min(1, 'Escribe tu consulta').max(300, 'Máximo 300 caracteres'),
  idioma: z.enum(['es', 'en', 'de']).default('es'),
});
