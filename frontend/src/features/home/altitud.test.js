import { describe, expect, it } from 'vitest';
import {
  altitudDeCategoria,
  altitudMedia,
  nombreCorto,
  ordenarCategorias,
  ordenarPorAltitud,
  pisoDe,
  posicionEnRegla,
  zonaDe,
} from './altitud';

describe('altitud', () => {
  it('ubica cada comunidad en su región natural', () => {
    expect(zonaDe(1050)).toBe('yunga');
    expect(zonaDe(2970)).toBe('quechua');
    expect(zonaDe(3760)).toBe('suni');
    expect(zonaDe(4100)).toBe('puna');
  });

  it('calcula la posición en la regla de 1,000 a 4,000 msnm', () => {
    expect(posicionEnRegla(1000)).toBe(0);
    expect(posicionEnRegla(2500)).toBe(0.5);
    expect(posicionEnRegla(4000)).toBe(1);
    expect(posicionEnRegla(500)).toBe(0);
    expect(posicionEnRegla(4800)).toBe(1);
  });

  it('acorta el nombre de la comunidad a su lugar', () => {
    expect(nombreCorto('Comunidad Cafetalera de Quillabamba')).toBe('Quillabamba');
    expect(nombreCorto('Comunidad de Anta')).toBe('Anta');
    expect(nombreCorto('Lares')).toBe('Lares');
  });

  it('ordena del valle a la cumbre y descarta las comunidades sin altitud', () => {
    const ordenadas = ordenarPorAltitud([
      { id: 1, altitudMsnm: 3760 },
      { id: 2, altitudMsnm: null },
      { id: 3, altitudMsnm: 1050 },
    ]);
    expect(ordenadas.map((c) => c.id)).toEqual([3, 1]);
  });

  it('usa la altitud media del rango de una categoría', () => {
    expect(altitudMedia({ altitudMin: 2792, altitudMax: 3345 })).toBe(3068.5);
    expect(altitudMedia({ altitudMin: null, altitudMax: null })).toBeNull();
  });

  it('asigna el piso de color del recorrido según la altitud', () => {
    expect(pisoDe(1050)).toBe('valle');
    expect(pisoDe(2792)).toBe('ladera');
    expect(pisoDe(3122)).toBe('altura');
    expect(pisoDe(3760)).toBe('altura');
  });

  it('ubica cada categoría a la altitud de su comunidad principal', () => {
    const textiles = {
      altitudMin: 3200,
      comunidadPrincipal: { nombre: 'Comunidad Alpaquera de Lares', altitudMsnm: 3200 },
    };
    expect(altitudDeCategoria(textiles)).toBe(3200);
    expect(altitudDeCategoria({ altitudMin: 2792, comunidadPrincipal: null })).toBe(2792);
    expect(altitudDeCategoria({ altitudMin: null, comunidadPrincipal: null })).toBeNull();

    const ordenadas = ordenarCategorias([
      { slug: 'vacia', altitudMin: null },
      { slug: 'textiles', altitudMin: 3200 },
      { slug: 'cafe', altitudMin: 1050 },
    ]);
    expect(ordenadas.map((c) => c.slug)).toEqual(['cafe', 'textiles', 'vacia']);
  });
});
