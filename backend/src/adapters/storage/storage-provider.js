/**
 * Contrato del almacenamiento de archivos (imágenes de productos). La implementación real usa
 * Supabase Storage; para otro proveedor (S3, Cloudinary...) basta con otra clase que cumpla
 * este contrato y cambiarla en adapters/storage/index.js.
 *
 * subir({ ruta, contenido: Buffer, tipo: 'image/webp' }) → { ruta, url }   (url pública)
 * eliminar(ruta) → void
 * rutaDesdeUrl(url) → ruta | null   (null si la URL no pertenece a este almacenamiento,
 *                                    p. ej. las fotos de Unsplash del seed)
 */
export class StorageProvider {
  async subir(_archivo) {
    throw new Error('StorageProvider.subir no está implementado');
  }

  async eliminar(_ruta) {
    throw new Error('StorageProvider.eliminar no está implementado');
  }

  rutaDesdeUrl(_url) {
    return null;
  }
}
