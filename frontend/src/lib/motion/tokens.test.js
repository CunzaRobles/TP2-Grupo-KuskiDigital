// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CURVA, cubicBezier, DURACION, milisegundos } from './tokens';

// Los tokens de movimiento viven en CSS (View Transitions, utilidades) y en JS (Motion, GSAP):
// deben coincidir.
const css = readFileSync(new URL('../../styles/tokens.css', import.meta.url), 'utf8');
const raiz = css.slice(css.indexOf(':root {'), css.indexOf('\n}', css.indexOf(':root {')));
const variable = (nombre) => raiz.match(new RegExp(`--${nombre}:\\s*([^;]+);`))?.[1].trim();

describe('tokens de movimiento', () => {
  it.each(Object.keys(DURACION))('la duración %s coincide en CSS y JS', (nombre) => {
    expect(variable(`duracion-${nombre}`)).toBe(`${milisegundos(nombre)}ms`);
  });

  it.each(Object.keys(CURVA))('la curva %s coincide en CSS y JS', (nombre) => {
    expect(variable(`curva-${nombre}`)).toBe(cubicBezier(CURVA[nombre]));
  });

  it('mantiene las duraciones entre 180 y 400 ms', () => {
    for (const segundos of Object.values(DURACION)) {
      expect(segundos).toBeGreaterThanOrEqual(0.18);
      expect(segundos).toBeLessThanOrEqual(0.4);
    }
  });
});
