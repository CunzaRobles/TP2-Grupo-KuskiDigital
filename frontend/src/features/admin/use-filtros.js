import { useSearchParams } from 'react-router';

/**
 * Filtros de una tabla guardados en la URL (?estado=pagado&page=2): se pueden compartir,
 * sobreviven a recargar y el botón "atrás" deshace el último filtro. Cambiar un filtro
 * vuelve a la página 1.
 */
export function useFiltrosUrl(claves) {
  const [params, setParams] = useSearchParams();

  const filtros = Object.fromEntries(claves.map((c) => [c, params.get(c) ?? '']));
  const page = Math.max(1, Number(params.get('page')) || 1);

  const actualizar = (cambios, { conservarPagina = false } = {}) => {
    setParams(
      (actuales) => {
        const nuevos = new URLSearchParams(actuales);
        for (const [clave, valor] of Object.entries(cambios)) {
          if (valor === '' || valor === undefined || valor === null) nuevos.delete(clave);
          else nuevos.set(clave, String(valor));
        }
        if (!conservarPagina && !('page' in cambios)) nuevos.delete('page');
        return nuevos;
      },
      { replace: false },
    );
  };

  const limpiar = () =>
    setParams((actuales) => {
      const nuevos = new URLSearchParams(actuales);
      for (const c of [...claves, 'page']) nuevos.delete(c);
      return nuevos;
    });

  const hayFiltros = claves.some((c) => filtros[c]);

  return {
    filtros,
    page,
    actualizar,
    limpiar,
    hayFiltros,
    setPage: (p) => actualizar({ page: p }),
  };
}
