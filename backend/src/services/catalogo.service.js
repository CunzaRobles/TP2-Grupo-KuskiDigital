import * as catalogoRepository from '../repositories/catalogo.repository.js';
import { aNumero } from '../utils/money.js';

// Países a los que Kuski ya exportaba antes de la tienda online (datos de la empresa para la
// demo). Se suman a los países con pedidos confirmados en la tienda para el contador del home.
// prettier-ignore
export const PAISES_EXPORTACION_HISTORICOS = [
  'US', 'CA', 'MX', 'BR', 'AR', 'CL', 'CO', 'EC', 'BO', 'UY', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE',
  'GB', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI', 'IE', 'PT', 'PL', 'JP', 'KR', 'CN', 'AU', 'NZ',
];

const aEnteroONull = (valor) => (valor == null ? null : Number(valor));

// Rango de altitud de origen (msnm) de cada categoría; null si no tiene productos activos.
export const listarCategorias = async () =>
  (await catalogoRepository.findCategorias()).map((c) => ({
    ...c,
    altitudMin: aEnteroONull(c.altitudMin),
    altitudMax: aEnteroONull(c.altitudMax),
  }));

export const listarCertificaciones = () => catalogoRepository.findCertificaciones();

// Coordenadas como número para el mapa (NUMERIC llega como string).
export const listarComunidades = async () =>
  (await catalogoRepository.findComunidades()).map((c) => ({
    ...c,
    latitud: aNumero(c.latitud),
    longitud: aNumero(c.longitud),
  }));

export const obtenerTrazabilidad = async () => {
  const { paisesConPedidos, ...totales } = await catalogoRepository.findTotalesTrazabilidad();
  const paises = new Set(PAISES_EXPORTACION_HISTORICOS);
  for (const pais of paisesConPedidos) if (pais !== 'PE') paises.add(pais);

  return {
    comunidades: totales.comunidades,
    familias: totales.familias,
    productos: totales.productos,
    paises: paises.size,
    altitudMinima: totales.altitudMinima,
    altitudMaxima: totales.altitudMaxima,
  };
};
