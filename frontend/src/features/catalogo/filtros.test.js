import { describe, expect, it } from 'vitest';
import {
  aQueryApi,
  aSearchParams,
  alternar,
  cambiarFiltros,
  claveCertificacion,
  contarFiltros,
  leerFiltros,
} from './filtros';

const leer = (qs) => leerFiltros(new URLSearchParams(qs));

describe('leerFiltros', () => {
  it('lee listas separadas por comas o repetidas, sin duplicados', () => {
    const f = leer('categoria=cafe,textiles&categoria=cafe&comunidad=1&comunidad=3,abc');
    expect(f.categorias).toEqual(['cafe', 'textiles']);
    expect(f.comunidades).toEqual([1, 3]);
  });

  it('usa valores por defecto e ignora lo inválido', () => {
    expect(leer('orden=azar&page=-2&precio_min=abc&categoria=Café!')).toEqual({
      categorias: [],
      comunidades: [],
      certificaciones: [],
      precioMin: undefined,
      precioMax: undefined,
      q: undefined,
      orden: 'destacados',
      page: 1,
    });
  });

  it('intercambia un rango de precio invertido', () => {
    const f = leer('precio_min=80&precio_max=10');
    expect([f.precioMin, f.precioMax]).toEqual([10, 80]);
  });
});

describe('aSearchParams', () => {
  it('es el inverso de leerFiltros y omite los valores por defecto', () => {
    const qs =
      'categoria=cafe%2Ctextiles&comunidad=2&precio_min=0&q=alpaca&orden=precio_asc&page=3';
    expect(aSearchParams(leer(qs)).toString()).toBe(qs);
    expect(aSearchParams(leer('orden=destacados&page=1')).toString()).toBe('');
  });
});

describe('cambios de filtros', () => {
  it('vuelve a la página 1 al cambiar un filtro', () => {
    const f = leer('page=4');
    expect(cambiarFiltros(f, { orden: 'nombre' }).page).toBe(1);
    expect(cambiarFiltros(f, { page: 5 }).page).toBe(5);
  });

  it('alterna valores y cuenta filtros activos', () => {
    expect(alternar([1, 2], 2)).toEqual([1]);
    expect(alternar([1], 3)).toEqual([1, 3]);
    expect(contarFiltros(leer('categoria=cafe,textiles&precio_max=50&orden=nombre'))).toBe(3);
  });
});

it('arma la consulta de la API en la moneda elegida', () => {
  expect(aQueryApi(leer('comunidad=1,3&precio_max=20'), 'EUR')).toMatchObject({
    comunidad: '1,3',
    precio_max: 20,
    orden: 'destacados',
    page: 1,
    limit: 12,
    moneda: 'EUR',
  });
});

it('genera la clave de traducción de una certificación', () => {
  expect(claveCertificacion('Orgánico')).toBe('organico');
  expect(claveCertificacion('Comercio Justo')).toBe('comercio-justo');
});
