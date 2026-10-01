import { describe, expect, it } from 'vitest';
import { imagenResponsiva, miniatura } from './imagen';

const UNSPLASH = 'https://images.unsplash.com/photo-1?auto=format&fit=crop&w=1200&q=80';

describe('imagenResponsiva', () => {
  it('genera srcset por ancho para Unsplash y conserva el recorte', () => {
    const { src, srcSet, sizes } = imagenResponsiva(UNSPLASH, '50vw');

    expect(sizes).toBe('50vw');
    expect(src).toContain('w=640');
    expect(src).toContain('fit=crop');
    expect(srcSet.split(', ')).toHaveLength(6);
    expect(srcSet).toContain('fit=crop&w=320&q=75 320w');
    expect(srcSet).not.toContain('w=1200');
  });

  it('usa tal cual otras URLs y tolera valores vacíos', () => {
    const storage = 'https://x.supabase.co/storage/v1/object/public/productos/1.webp';
    expect(imagenResponsiva(storage, '50vw')).toEqual({ src: storage });
    expect(imagenResponsiva('/local.png', '50vw')).toEqual({ src: '/local.png' });
    expect(imagenResponsiva(undefined, '50vw')).toEqual({});
  });

  it('las miniaturas piden como máximo 240 px', () => {
    const { srcSet, sizes } = miniatura(UNSPLASH, 48);
    expect(sizes).toBe('48px');
    expect(srcSet).toContain('240w');
    expect(srcSet).not.toContain('320w');
  });
});
