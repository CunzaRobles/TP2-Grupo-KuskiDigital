import { describe, expect, it } from 'vitest';
import i18n from '@/lib/i18n';
import de from './de.json';
import en from './en.json';
import es from './es.json';

// Aplana { a: { b: 'x' } } → [['a.b', 'x']]
const aplanar = (objeto, prefijo = '') =>
  Object.entries(objeto).flatMap(([clave, valor]) =>
    typeof valor === 'object'
      ? aplanar(valor, `${prefijo}${clave}.`)
      : [[`${prefijo}${clave}`, valor]],
  );

const variables = (texto) => [...texto.matchAll(/{{\s*(\w+)/g)].map((m) => m[1]).sort();

const ES = new Map(aplanar(es));

describe.each([
  ['en', en],
  ['de', de],
])('traducciones %s', (_idioma, traduccion) => {
  const mapa = new Map(aplanar(traduccion));

  it('tiene exactamente las mismas claves que es', () => {
    expect([...mapa.keys()].sort()).toEqual([...ES.keys()].sort());
  });

  it('no deja textos vacíos y conserva las variables de interpolación', () => {
    for (const [clave, texto] of mapa) {
      expect(texto.trim(), clave).not.toBe('');
      expect(variables(texto), clave).toEqual(variables(ES.get(clave)));
    }
  });
});

describe('carga de idiomas', () => {
  it('descarga inglés y alemán bajo demanda al cambiar de idioma', async () => {
    await i18n.changeLanguage('de');
    expect(i18n.t('nav.saltarContenido')).toBe(de.nav.saltarContenido);

    await i18n.changeLanguage('en');
    expect(i18n.t('nav.saltarContenido')).toBe(en.nav.saltarContenido);
  });
});
