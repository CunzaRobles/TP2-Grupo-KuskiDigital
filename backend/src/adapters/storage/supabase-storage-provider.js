import { StorageClient } from '@supabase/storage-js';
import { AppError } from '../../utils/app-error.js';
import { StorageProvider } from './storage-provider.js';

// Supabase Storage con la service_role key (solo en el backend). El bucket es público:
// la tienda muestra las imágenes con su URL pública, sin pasar por la API.
export class SupabaseStorageProvider extends StorageProvider {
  constructor({ url, serviceRoleKey, bucket }) {
    super();
    this.bucket = bucket;
    // Solo el origen: acepta https://<ref>.supabase.co y también la URL con /rest/v1/.
    this.client = new StorageClient(`${new URL(url).origin}/storage/v1`, {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    });
    // Prefijo de las URLs públicas de este bucket (para reconocer las imágenes propias).
    this.prefijoPublico = this.client.from(bucket).getPublicUrl('').data.publicUrl;
  }

  async subir({ ruta, contenido, tipo }) {
    const { error } = await this.client.from(this.bucket).upload(ruta, contenido, {
      contentType: tipo,
      cacheControl: '31536000',
      upsert: false,
    });
    if (error) {
      console.error('Supabase Storage (subir):', error.message);
      throw new AppError(502, 'STORAGE_ERROR', 'No se pudo guardar la imagen, inténtalo de nuevo');
    }
    return { ruta, url: this.client.from(this.bucket).getPublicUrl(ruta).data.publicUrl };
  }

  async eliminar(ruta) {
    const { error } = await this.client.from(this.bucket).remove([ruta]);
    if (error) console.error('Supabase Storage (eliminar):', error.message);
  }

  rutaDesdeUrl(url) {
    return url?.startsWith(this.prefijoPublico) ? url.slice(this.prefijoPublico.length) : null;
  }
}
