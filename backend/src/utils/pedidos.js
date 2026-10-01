// KD-000001: el número visible sale del id del pedido.
export const formatearCodigo = (id) => `KD-${String(id).padStart(6, '0')}`;
