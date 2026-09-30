import { describe, expect, it } from 'vitest';
import { formatMoney, localeDe } from './format';

// Intl usa espacios duros (U+00A0 / U+202F): se normalizan para comparar.
const plano = (texto) => texto.replace(/\s/g, ' ');

describe('formatMoney', () => {
  it('formatea soles con el símbolo S/', () => {
    expect(plano(formatMoney(48, 'PEN', 'es'))).toBe('S/ 48.00');
  });

  it('usa el símbolo corto de dólar y euro', () => {
    expect(plano(formatMoney(12.8, 'USD', 'en'))).toBe('$12.80');
    expect(plano(formatMoney(11.9, 'EUR', 'de'))).toBe('11,90 €');
  });

  it('respeta el separador decimal del idioma', () => {
    expect(plano(formatMoney(1234.5, 'EUR', 'de'))).toBe('1.234,50 €');
    expect(plano(formatMoney(1234.5, 'USD', 'en'))).toBe('$1,234.50');
  });

  it('acepta montos NUMERIC que llegan como string', () => {
    expect(plano(formatMoney('35.00', 'PEN', 'es'))).toBe('S/ 35.00');
  });

  it('devuelve un guion si el monto no es válido', () => {
    expect(formatMoney(undefined)).toBe('—');
    expect(formatMoney(null)).toBe('—');
    expect(formatMoney('abc')).toBe('—');
  });
});

describe('localeDe', () => {
  it('mapea idioma a locale y cae en es-PE por defecto', () => {
    expect(localeDe('de')).toBe('de-DE');
    expect(localeDe('en-GB')).toBe('en-US');
    expect(localeDe('fr')).toBe('es-PE');
  });
});
