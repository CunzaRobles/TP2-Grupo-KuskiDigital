import { StorageProvider } from './storage-provider.js';

const PREFIJO = 'https://storage.test/productos/';

// Almacenamiento en memoria para las pruebas (no sale a la red).
export class MemoriaStorageProvider extends StorageProvider {
  constructor() {
    super();
    this.archivos = new Map();
  }

  async subir({ ruta, contenido, tipo }) {
    this.archivos.set(ruta, { contenido, tipo });
    return { ruta, url: `${PREFIJO}${ruta}` };
  }

  async eliminar(ruta) {
    this.archivos.delete(ruta);
  }

  rutaDesdeUrl(url) {
    return url?.startsWith(PREFIJO) ? url.slice(PREFIJO.length) : null;
  }
}
