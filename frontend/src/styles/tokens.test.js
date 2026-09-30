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

describe.each([':root', '.dark'])('contraste AA de los tokens (%s)', (selector) => {
  const tema = resolverTema(selector);

  it.each(TEXTO)('texto %s sobre %s ≥ 4.5:1', (fg, bg) => {
    expect(contrastRatio(tema[fg], tema[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(NO_TEXTO)('%s sobre %s ≥ 3:1', (fg, bg) => {
    expect(contrastRatio(tema[fg], tema[bg])).toBeGreaterThanOrEqual(3);
  });
});

describe('paleta de marca', () => {
  it('conserva los valores exactos de CLAUDE.md', () => {
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
