// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '@/lib/contrast';

// Lee tokens.css y resuelve las variables semánticas de :root y .dark a hexadecimal.
const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');

const leerVariables = (bloque) =>
  Object.fromEntries(
    [...bloque.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, nombre, valor]) => [
      nombre,
      valor.trim(),
    ]),
  );

const bloque = (selector) => {
  const inicio = css.indexOf(`${selector} {`);
  return css.slice(inicio, css.indexOf('\n}', inicio));
};

const paleta = leerVariables(bloque('@theme'));

const resolverTema = (selector) => {
  const vars = leerVariables(bloque(selector));
  const resolver = (valor) => {
    const ref = valor.match(/^var\(--([\w-]+)\)$/);
    return ref ? resolver(paleta[ref[1]] ?? vars[ref[1]]) : valor;
  };
  return Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, resolver(v)]));
};

// [primer plano, fondo]
const TEXTO = [
  ['foreground', 'background'],
  ['foreground', 'surface'],
  ['card-foreground', 'card'],
  ['popover-foreground', 'popover'],
  ['muted-foreground', 'background'],
  ['muted-foreground', 'card'],
  ['muted-foreground', 'muted'],
  ['primary-foreground', 'primary'],
  ['primary-foreground', 'primary-hover'],
  ['secondary-foreground', 'secondary'],
  ['secondary-foreground', 'secondary-hover'],
  ['accent-foreground', 'accent'],
  ['link', 'background'],
  ['link', 'surface'],
  ['link', 'card'],
  ['destructive', 'background'],
  ['destructive', 'card'],
  ['destructive-foreground', 'destructive'],
  ['success', 'background'],
  ['success', 'card'],
  ['success-foreground', 'success'],
];

// Componentes de interfaz (WCAG 1.4.11): bordes de inputs, anillo de foco, botón sobre la página
const NO_TEXTO = [
  ['input', 'background'],
  ['input', 'card'],
  ['ring', 'background'],
  ['ring', 'card'],
  ['primary', 'background'],
  ['chart-1', 'card'],
  ['chart-1', 'background'],
];

// .dark se aplica junto a .admin: hereda de él lo que no redefine
const TEMAS = {
  ':root': resolverTema(':root'),
  '.admin': resolverTema('.admin'),
  '.dark': { ...resolverTema('.admin'), ...resolverTema('.dark') },
};

describe.each(Object.keys(TEMAS))('contraste AA de los tokens (%s)', (selector) => {
  const tema = TEMAS[selector];

  it.each(TEXTO)('texto %s sobre %s ≥ 4.5:1', (fg, bg) => {
    expect(contrastRatio(tema[fg], tema[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(NO_TEXTO)('%s sobre %s ≥ 3:1', (fg, bg) => {
    expect(contrastRatio(tema[fg], tema[bg])).toBeGreaterThanOrEqual(3);
  });
});

const color = (nombre) => paleta[`color-${nombre}`];

describe('paleta de la tienda', () => {
  it('conserva los valores exactos de CLAUDE.md', () => {
    expect(paleta).toMatchObject({
      'color-puna': '#1b2440',
      'color-cochinilla': '#a3123a',
      'color-ichu': '#c9a55a',
      'color-musgo': '#3e5a3a',
      'color-niebla': '#eef0ec',
      'color-blanco': '#ffffff',
      'color-niebla-texto': '#5b6270',
      'color-niebla-borde': '#838a82',
      'color-error': '#9a3412',
    });
  });

  // [primer plano, fondo, mínimo]
  it.each([
    ['niebla-texto', 'niebla', 4.5],
    ['niebla-texto', 'blanco', 4.5],
    ['niebla-borde', 'niebla', 3],
    ['niebla-borde', 'blanco', 3],
    ['error', 'niebla', 4.5],
    ['error', 'blanco', 4.5],
    ['cochinilla', 'niebla', 4.5],
    ['blanco', 'cochinilla-700', 4.5],
    // Banda Puna (footer): texto Niebla, acentos Ichu
    ['niebla', 'puna', 4.5],
    ['ichu', 'puna', 4.5],
    // Recorrido de categorías: texto Niebla en el valle (Musgo), Puna en la ladera (Ichu)
    ['niebla', 'musgo', 4.5],
    ['puna', 'ichu', 4.5],
  ])('%s sobre %s ≥ %s:1', (fg, bg, minimo) => {
    expect(contrastRatio(color(fg), color(bg))).toBeGreaterThanOrEqual(minimo);
  });

  it('Ichu no sirve como texto sobre Niebla ni Cochinilla sobre Puna (reglas de CLAUDE.md)', () => {
    expect(contrastRatio(color('ichu'), color('niebla'))).toBeLessThan(3);
    expect(contrastRatio(color('cochinilla'), color('puna'))).toBeLessThan(3);
  });
});

describe('paleta del panel admin', () => {
  it('conserva los valores de "editorial andino"', () => {
    expect(paleta).toMatchObject({
      'color-cafe': '#2b1d14',
      'color-terracota': '#b5532c',
      'color-maiz': '#d9a441',
      'color-crema': '#f5efe4',
      'color-alpaca': '#fbf9f5',
      'color-verde': '#4f6b4a',
    });
  });
});
