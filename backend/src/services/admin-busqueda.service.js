import { puede } from '../config/permisos.js';
import * as pedidoRepository from '../repositories/pedido.repository.js';
import * as productoRepository from '../repositories/producto.repository.js';
import * as usuarioRepository from '../repositories/usuario.repository.js';

const POR_GRUPO = { limit: 5, offset: 0 };

/**
 * Búsqueda rápida del panel (Ctrl+K). Cada grupo solo se consulta si el rol puede ver esa
 * sección: logística no recibe usuarios, ventas no recibe productos, etc.
 */
export const buscar = async ({ rol }, q) => {
  const verProductos = puede(rol, 'productos') || puede(rol, 'inventario');
  const [productos, pedidos, usuarios] = await Promise.all([
    verProductos ? productoRepository.findAdmin({ q }, POR_GRUPO) : null,
    puede(rol, 'pedidos') ? pedidoRepository.findAdmin({ q }, POR_GRUPO) : null,
    puede(rol, 'usuarios') ? usuarioRepository.findAdmin({ q }, POR_GRUPO) : null,
  ]);

  return {
    productos: (productos?.rows ?? []).map((p) => ({
      id: p.id,
      sku: p.sku,
      nombre: p.nombre,
      stock: p.stock,
      activo: p.activo,
    })),
    pedidos: (pedidos?.rows ?? []).map((p) => ({
      codigo: p.codigo,
      estado: p.estado,
      destinatario: p.envioDestinatario,
      totalPen: Number(p.totalPen),
    })),
    usuarios: (usuarios?.rows ?? []).map((u) => ({
      id: u.id,
      nombre: `${u.nombre} ${u.apellido}`,
      correo: u.correo,
      rol: u.rol,
    })),
  };
};
