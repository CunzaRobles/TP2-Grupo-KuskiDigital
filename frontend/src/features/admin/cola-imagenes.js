import { useEffect, useRef, useState } from 'react';

// Mismos límites que el backend (middleware/upload.js y admin-producto.service.js).
export const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];
export const TAMANO_MAX = 4 * 1024 * 1024;
export const MAX_IMAGENES = 8;

let secuencia = 0;

/**
 * Cola de fotos elegidas en el navegador, con vista previa local (object URL) antes de subirlas.
 * `validar` descarta tipos y tamaños que la API rechazaría, con un aviso claro.
 */
export function useColaImagenes() {
  const [cola, setCola] = useState([]);
  const urls = useRef(new Set());

  // Libera las vistas previas al salir de la página.
  useEffect(() => {
    const creadas = urls.current;
    return () => {
      for (const url of creadas) URL.revokeObjectURL(url);
    };
  }, []);

  const agregar = (archivos) => {
    const nuevos = archivos.map((archivo) => {
      const preview = URL.createObjectURL(archivo);
      urls.current.add(preview);
      secuencia += 1;
      return { id: `local-${secuencia}`, archivo, preview, estado: 'pendiente' };
    });
    setCola((c) => [...c, ...nuevos]);
    return nuevos;
  };

  const quitar = (id) =>
    setCola((c) => {
      const item = c.find((i) => i.id === id);
      if (item) {
        URL.revokeObjectURL(item.preview);
        urls.current.delete(item.preview);
      }
      return c.filter((i) => i.id !== id);
    });

  const marcar = (id, cambios) =>
    setCola((c) => c.map((i) => (i.id === id ? { ...i, ...cambios } : i)));

  return { cola, agregar, quitar, marcar };
}

/**
 * Sube los archivos de la cola uno a uno (el backend acepta una imagen por petición).
 * Los que suben bien salen de la cola: la imagen ya aparece en la ficha del producto.
 */
export async function subirCola({ items, productoId, subir, quitar, marcar }) {
  let fallos = 0;
  for (const item of items) {
    marcar(item.id, { estado: 'subiendo', error: null });
    try {
      await subir.mutateAsync({ productoId, archivo: item.archivo });
      quitar(item.id);
    } catch (error) {
      fallos += 1;
      marcar(item.id, { estado: 'error', error });
    }
  }
  return fallos;
}
