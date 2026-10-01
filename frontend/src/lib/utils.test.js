import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('reconoce las sombras propias como sombras', () => {
    expect(cn('shadow-soft', 'shadow-none')).toBe('shadow-none');
    expect(cn('shadow-field', 'shadow-none')).toBe('shadow-none');
  });

  it('reconoce los radios semánticos como radios', () => {
    expect(cn('rounded-field', 'rounded-none')).toBe('rounded-none');
    expect(cn('rounded-button', 'rounded-full')).toBe('rounded-full');
  });

  it('distingue los tamaños de texto propios de los colores', () => {
    expect(cn('text-h3', 'text-link')).toBe('text-h3 text-link');
    expect(cn('text-h3', 'text-lg')).toBe('text-lg');
  });
});
