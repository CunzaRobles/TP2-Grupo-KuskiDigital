import { env } from '../../config/env.js';
import { AppError } from '../../utils/app-error.js';
import { MemoriaStorageProvider } from './memoria-storage-provider.js';
import { StorageProvider } from './storage-provider.js';
import { SupabaseStorageProvider } from './supabase-storage-provider.js';

// Sin credenciales de Supabase la API arranca igual; solo falla la subida de imágenes.
class StorageNoConfigurado extends StorageProvider {
  async subir() {
    throw new AppError(
      503,
      'STORAGE_NO_CONFIGURADO',
      'Falta configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en backend/.env',
    );
  }

  async eliminar() {}
}

const crearStorage = () => {
  if (env.NODE_ENV === 'test') return new MemoriaStorageProvider();
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return new StorageNoConfigurado();
  return new SupabaseStorageProvider({
    url: env.SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    bucket: env.SUPABASE_STORAGE_BUCKET,
  });
};

// Punto único de cambio del proveedor de almacenamiento.
export const storageProvider = crearStorage();
