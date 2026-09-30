// Escapa los comodines de ILIKE para que la búsqueda sea literal.
export const escaparLike = (texto) => texto.replace(/[\\%_]/g, (c) => `\\${c}`);
