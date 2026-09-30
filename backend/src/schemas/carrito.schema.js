import { z } from 'zod';
import { itemCarritoSchema } from './comun.schema.js';

export const agregarItemBody = z.object({
  productoId: z.number().int().positive(),
  cantidad: z.number().int().min(1).max(99).default(1),
});

export const actualizarItemBody = z.object({
  cantidad: z.number().int().min(1).max(99),
});

// Carrito de invitado guardado en localStorage (fusión al iniciar sesión y precios).
export const invitadoBody = z.object({
  items: z.array(itemCarritoSchema).max(50),
});

export const fusionarBody = z.object({
  items: z.array(itemCarritoSchema).max(50),
});
