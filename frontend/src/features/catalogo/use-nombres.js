import { useTranslation } from 'react-i18next';
import { claveCertificacion } from './filtros';

// Nombres traducidos de los datos del catálogo (con el nombre de la API como respaldo).
export function useNombres() {
  const { t } = useTranslation();
  return {
    categoria: (c) => t(`catalogo.categorias.${c.slug}.nombre`, { defaultValue: c.nombre }),
    certificacion: (c) =>
      t(`certificaciones.${claveCertificacion(c.nombre)}`, { defaultValue: c.nombre }),
  };
}
