import { randomUUID } from 'node:crypto';
import { storageProvider } from '../adapters/storage/index.js';
import * as catalogoRepository from '../repositories/catalogo.repository.js';
import * as inventarioRepository from '../repositories/inventario.repository.js';
import * as productoRepository from '../repositories/producto.repository.js';
import { withTransaction } from '../repositories/transaction.repository.js';
import { AppError } from '../utils/app-error.js';
import { slugify } from '../utils/slug.js';

export const MAX_IMAGENES = 8;

const productoNoEncontrado = () =>
  new AppError(404, 'PRODUCTO_NO_ENCONTRADO', 'No encontramos ese producto');

const toImagenDTO = (i) => ({
  id: i.id,
  url: i.url,
  textoAlt: i.textoAlt,
  orden: i.orden,
  esPrincipal: i.esPrincipal,
});

const imagenPrincipal = (imagenes = []) => {
  const i = imagenes.find((img) => img.esPrincipal !== false) ?? imagenes[0];
  return i ? { url: i.url, textoAlt: i.textoAlt } : null;
};

const toProductoAdminDTO = (p) => ({
  id: p.id,
  sku: p.sku,
  nombre: p.nombre,
  slug: p.slug,
  precioBasePen: Number(p.precioBasePen),
  stock: p.stock,
  stockMinimo: p.stockMinimo,
  stockBajo: p.stock <= p.stockMinimo,
  pesoG: p.pesoG,
  destacado: p.destacado,
  activo: p.activo,
  categoria: p.categoria ?? null,
  comunidad: p.comunidad ?? null,
  imagen: imagenPrincipal(p.imagenes),
  actualizadoEn: p.actualizadoEn,
});

const toProductoDetalleDTO = (p) => ({
  ...toProductoAdminDTO(p),
  descripcion: p.descripcion,
  categoriaId: p.categoriaId,
  comunidadId: p.comunidadId,
  imagenes: (p.imagenes ?? []).map(toImagenDTO),
  certificaciones: p.certificaciones ?? [],
  certificacionIds: (p.certificaciones ?? []).map((c) => c.id),
  creadoEn: p.creadoEn,
});

export const listarProductos = async ({ page, limit, ...filtros }) => {
  const { rows, count } = await productoRepository.findAdmin(filtros, {
    limit,
    offset: (page - 1) * limit,
  });
  return {
    items: rows.map(toProductoAdminDTO),
    pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
  };
};

export const obtenerProducto = async (id) => {
  const producto = await productoRepository.findAdminById(id);
  if (!producto) throw productoNoEncontrado();
  return toProductoDetalleDTO(producto);
};

const validarReferencias = async ({ categoriaId, comunidadId, certificacionIds }) => {
  const ref = await catalogoRepository.findReferencias({
    categoriaId,
    comunidadId,
    certificacionIds,
  });
  if (!ref.categoria) throw new AppError(422, 'CATEGORIA_NO_EXISTE', 'La categoría no existe');
  if (!ref.comunidad) throw new AppError(422, 'COMUNIDAD_NO_EXISTE', 'La comunidad no existe');
  const faltantes = (certificacionIds ?? []).filter((id) => !ref.certificacionIds.includes(id));
  if (faltantes.length) {
    throw new AppError(422, 'CERTIFICACION_NO_EXISTE', 'Alguna certificación no existe', {
      certificacionIds: faltantes,
    });
  }
};

const validarUnicos = async ({ sku, slug }, excluirId) => {
  const conflictos = await productoRepository.findConflictos({ sku, slug }, excluirId);
  if (conflictos.sku)
    throw new AppError(409, 'SKU_EN_USO', `Ya existe un producto con el SKU ${sku}`);
  if (conflictos.slug) {
    throw new AppError(409, 'SLUG_EN_USO', `Ya existe un producto con la URL "${slug}"`);
  }
};

/**
 * Crea el producto. El stock inicial entra como movimiento "entrada" del kardex en la misma
 * transacción, para que el historial explique siempre el stock actual.
 */
export const crearProducto = async (
  admin,
  { certificacionIds = [], stockInicial = 0, ...datos },
) => {
  const slug = datos.slug || slugify(datos.nombre);
  await validarReferencias({ ...datos, certificacionIds });
  await validarUnicos({ sku: datos.sku, slug });

  const id = await withTransaction(async (tx) => {
    const producto = await productoRepository.create({ ...datos, slug, stock: stockInicial }, tx);
    await productoRepository.setCertificaciones(producto.id, certificacionIds, tx);
    if (stockInicial > 0) {
      await inventarioRepository.createMovimiento(
        {
          productoId: producto.id,
          tipo: 'entrada',
          cantidad: stockInicial,
          stockResultante: stockInicial,
          motivo: 'Stock inicial',
          usuarioId: admin.id,
        },
        tx,
      );
    }
    return producto.id;
  });

  return obtenerProducto(id);
};

// Actualiza los datos del producto. El stock no se edita aquí: solo con movimientos de inventario.
export const actualizarProducto = async (id, { certificacionIds, ...cambios }) => {
  const actual = await productoRepository.findAdminById(id);
  if (!actual) throw productoNoEncontrado();

  await validarReferencias({ ...cambios, certificacionIds });
  await validarUnicos({ sku: cambios.sku, slug: cambios.slug }, id);

  await withTransaction(async (tx) => {
    if (Object.keys(cambios).length) await productoRepository.update(id, cambios, tx);
    if (certificacionIds) await productoRepository.setCertificaciones(id, certificacionIds, tx);
  });
  return obtenerProducto(id);
};

// Baja lógica: los pedidos históricos siguen apuntando al producto (pedido_items RESTRICT).
export const desactivarProducto = async (id) => {
  const actual = await productoRepository.findAdminById(id);
  if (!actual) throw productoNoEncontrado();
  await productoRepository.update(id, { activo: false, destacado: false });
  return obtenerProducto(id);
};

// ─────────────────────────── Imágenes ───────────────────────────

// Tipo real según los primeros bytes (no se confía en el mimetype que declara el navegador).
export const detectarImagen = (buffer) => {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { tipo: 'image/jpeg', extension: 'jpg' };
  }
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { tipo: 'image/png', extension: 'png' };
  }
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return { tipo: 'image/webp', extension: 'webp' };
  }
  return null;
};

/**
 * Sube la imagen al bucket "productos" de Supabase Storage y guarda su URL pública en
 * producto_imagenes. La primera imagen del producto queda como principal.
 */
export const subirImagen = async (productoId, archivo, { textoAlt } = {}) => {
  if (!archivo)
    throw new AppError(400, 'IMAGEN_REQUERIDA', 'Adjunta una imagen en el campo "imagen"');
  const producto = await productoRepository.findAdminById(productoId);
  if (!producto) throw productoNoEncontrado();

  const imagenes = producto.imagenes ?? [];
  if (imagenes.length >= MAX_IMAGENES) {
    throw new AppError(
      422,
      'LIMITE_IMAGENES',
      `Un producto admite como máximo ${MAX_IMAGENES} imágenes`,
    );
  }
  const formato = detectarImagen(archivo.buffer);
  if (!formato) {
    throw new AppError(
      415,
      'TIPO_ARCHIVO_INVALIDO',
      'El archivo no es una imagen JPG, PNG o WebP válida',
    );
  }

  const { ruta, url } = await storageProvider.subir({
    ruta: `${productoId}/${randomUUID()}.${formato.extension}`,
    contenido: archivo.buffer,
    tipo: formato.tipo,
  });

  try {
    const imagen = await productoRepository.createImagen({
      productoId,
      url,
      textoAlt: textoAlt || producto.nombre,
      orden: imagenes.reduce((max, i) => Math.max(max, i.orden), -1) + 1,
      esPrincipal: !imagenes.some((i) => i.esPrincipal),
    });
    return toImagenDTO(imagen);
  } catch (error) {
    // Sin fila en la base, el archivo quedaría huérfano en el bucket.
    await storageProvider.eliminar(ruta);
    throw error;
  }
};

const buscarImagen = async (productoId, imagenId, tx) => {
  const imagenes = await productoRepository.findImagenes(productoId, tx);
  const imagen = imagenes.find((i) => i.id === imagenId);
  if (!imagen) throw new AppError(404, 'IMAGEN_NO_ENCONTRADA', 'No encontramos esa imagen');
  return { imagen, imagenes };
};

// Marca la imagen como principal y/o cambia su orden o texto alternativo.
export const actualizarImagen = async (productoId, imagenId, { esPrincipal, orden, textoAlt }) => {
  await withTransaction(async (tx) => {
    await buscarImagen(productoId, imagenId, tx);
    if (esPrincipal) await productoRepository.desmarcarImagenPrincipal(productoId, tx);
    const cambios = {
      ...(esPrincipal && { esPrincipal: true }),
      ...(orden !== undefined && { orden }),
      ...(textoAlt !== undefined && { textoAlt }),
    };
    if (Object.keys(cambios).length) await productoRepository.updateImagen(imagenId, cambios, tx);
  });
  return (await productoRepository.findImagenes(productoId)).map(toImagenDTO);
};

// Elimina la imagen (y el archivo si está en nuestro bucket). Si era la principal, pasa a serlo la siguiente.
export const eliminarImagen = async (productoId, imagenId) => {
  const eliminada = await withTransaction(async (tx) => {
    const { imagen, imagenes } = await buscarImagen(productoId, imagenId, tx);
    await productoRepository.deleteImagen(imagenId, tx);
    const siguiente = imagenes.find((i) => i.id !== imagenId);
    if (imagen.esPrincipal && siguiente) {
      await productoRepository.updateImagen(siguiente.id, { esPrincipal: true }, tx);
    }
    return imagen;
  });

  const ruta = storageProvider.rutaDesdeUrl(eliminada.url);
  if (ruta) await storageProvider.eliminar(ruta);
  return (await productoRepository.findImagenes(productoId)).map(toImagenDTO);
};
